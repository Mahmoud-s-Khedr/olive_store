const pool = require('../config/database');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

async function listByUser(userId) {
  const result = await pool.query(
    `SELECT id, user_id, full_name, phone, address_line1, address_line2, city, postal_code,
            created_at, updated_at
     FROM addresses
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function createAddress(userId, data, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `INSERT INTO addresses
        (user_id, full_name, phone, address_line1, address_line2, city, postal_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, full_name, phone, address_line1, address_line2, city, postal_code,
                 created_at, updated_at`,
      [
        userId,
        data.full_name,
        data.phone,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.postal_code || null,
      ]
    );
    return result.rows[0];
  });
}

async function updateAddress(userId, id, data, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `UPDATE addresses
       SET full_name = $1,
           phone = $2,
           address_line1 = $3,
           address_line2 = $4,
           city = $5,
           postal_code = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, full_name, phone, address_line1, address_line2, city, postal_code,
                 created_at, updated_at`,
      [
        data.full_name,
        data.phone,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.postal_code || null,
        id,
        userId,
      ]
    );
    return result.rows[0];
  });
}

async function removeAddress(userId, id, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  });
}

module.exports = {
  listByUser,
  createAddress,
  updateAddress,
  removeAddress,
};
