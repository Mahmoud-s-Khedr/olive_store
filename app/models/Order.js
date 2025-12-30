const pool = require('../config/database');
const { withTransaction } = require('../utils/transaction');

function generateOrderNumber() {
  const now = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `OR${now}${rand}`;
}

async function createOrder(userId, data, items, client) {
  if (client) {
    return createOrderWithClient(client, userId, data, items);
  }

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    const order = await createOrderWithClient(dbClient, userId, data, items);
    await dbClient.query('COMMIT');
    return order;
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

async function createOrderWithClient(client, userId, data, items) {
  const orderNumber = generateOrderNumber();
  const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, user_id, status, subtotal, shipping_cost, discount, total,
        customer_name, email, phone, address, city, postal_code, notes, payment_method, payment_status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,$15,$16
      ) RETURNING *`,
      [
        orderNumber,
        userId,
        'pending',
        data.subtotal,
        data.shipping_cost || 0,
        data.discount || 0,
        data.total,
        data.customer_name,
        data.email || null,
        data.phone,
        data.address,
        data.city,
        data.postal_code || null,
        data.notes || null,
        data.payment_method,
        'pending',
      ]
    );
  const order = orderResult.rows[0];

  for (const item of items) {
    if (item.product_id) {
      const stockResult = await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id',
        [item.quantity, item.product_id]
      );
      if (!stockResult.rows.length) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }
    }
    await client.query(
      `INSERT INTO order_items (
        order_id, product_id, product_name_ar, product_name_en, product_image,
        quantity, price, total
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        order.id,
        item.product_id || null,
        item.product_name_ar,
        item.product_name_en,
        item.product_image || null,
        item.quantity,
        item.price,
        item.total,
      ]
    );
  }

  return order;
}

async function listForUser(userId) {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function findByOrderNumber(orderNumber) {
  const result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
  return result.rows[0];
}

async function listItems(orderId) {
  const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  return result.rows;
}

async function addPaymentProof(orderId, fileId, reference, client) {
  if (client) {
    const result = await client.query(
      `UPDATE orders
       SET payment_proof_id = $1, payment_reference = $2, payment_status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [fileId || null, reference || null, orderId]
    );
    return result.rows[0];
  }
  return withTransaction(async (db) => {
    const result = await db.query(
      `UPDATE orders
       SET payment_proof_id = $1, payment_reference = $2, payment_status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [fileId || null, reference || null, orderId]
    );
    return result.rows[0];
  });
}

async function cancelOrder(orderId, reason, client) {
  if (client) {
    const result = await client.query(
      `UPDATE orders
       SET status = 'cancelled', cancellation_reason = $1, cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [reason || null, orderId]
    );
    return result.rows[0];
  }
  return withTransaction(async (db) => {
    const result = await db.query(
      `UPDATE orders
       SET status = 'cancelled', cancellation_reason = $1, cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [reason || null, orderId]
    );
    return result.rows[0];
  });
}

async function listAdmin({ page = 1, limit = 50, status, payment_status } = {}) {
  const offset = (page - 1) * limit;
  const clauses = [];
  const values = [];

  if (status) {
    values.push(status);
    clauses.push(`status = $${values.length}`);
  }

  if (payment_status) {
    values.push(payment_status);
    clauses.push(`payment_status = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const itemsQuery = `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const countQuery = `SELECT COUNT(*) FROM orders ${where}`;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(itemsQuery, [...values, limit, offset]),
    pool.query(countQuery, values),
  ]);

  return {
    items: itemsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
  };
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateStatus(id, status, client) {
  if (client) {
    const result = await client.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
  return withTransaction(async (db) => {
    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  });
}

async function updatePaymentStatus(id, payment_status, client) {
  if (client) {
    const result = await client.query(
      `UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [payment_status, id]
    );
    return result.rows[0];
  }
  return withTransaction(async (db) => {
    const result = await db.query(
      `UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [payment_status, id]
    );
    return result.rows[0];
  });
}

async function listByCustomer(customerId) {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [customerId]
  );
  return result.rows;
}

async function listCustomerSummaries({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, COUNT(o.id) as orders_count, MAX(o.created_at) as last_order_at
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id
     ORDER BY last_order_at DESC NULLS LAST, u.id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countRes = await pool.query('SELECT COUNT(*) FROM users');
  return { items: result.rows, total: parseInt(countRes.rows[0].count, 10), page, limit };
}

async function getMetricsSummary() {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
      COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
      SUM(CASE WHEN status NOT IN ('cancelled') AND payment_status = 'paid' THEN total ELSE 0 END) as revenue_paid,
      SUM(CASE WHEN status NOT IN ('cancelled') THEN total ELSE 0 END) as revenue_all
     FROM orders`
  );
  return result.rows[0];
}

module.exports = {
  createOrder,
  listForUser,
  findByOrderNumber,
  listItems,
  addPaymentProof,
  cancelOrder,
  listAdmin,
  findById,
  updateStatus,
  updatePaymentStatus,
  listByCustomer,
  listCustomerSummaries,
  getMetricsSummary,
};
