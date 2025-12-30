const pool = require('../config/database');
const slugify = require('../utils/slugify');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

function buildFilters(filters = {}) {
  const clauses = ['p.is_active = TRUE'];
  const values = [];
  let joinCategory = false;

  if (filters.categorySlug) {
    joinCategory = true;
    values.push(filters.categorySlug);
    clauses.push(`c.slug = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(p.name_ar ILIKE $${values.length} OR p.name_en ILIKE $${values.length} OR p.description_en ILIKE $${values.length} OR p.description_ar ILIKE $${values.length})`);
  }

  if (filters.min_price) {
    values.push(filters.min_price);
    clauses.push(`p.price >= $${values.length}`);
  }

  if (filters.max_price) {
    values.push(filters.max_price);
    clauses.push(`p.price <= $${values.length}`);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values, joinCategory };
}

function buildSort(sort) {
  switch (sort) {
    case 'price_asc':
      return 'ORDER BY p.price ASC';
    case 'price_desc':
      return 'ORDER BY p.price DESC';
    case 'oldest':
      return 'ORDER BY p.created_at ASC';
    default:
      return 'ORDER BY p.created_at DESC';
  }
}

async function listPublic({ page = 1, limit = 12, categorySlug, sort, search, min_price, max_price }) {
  const offset = (page - 1) * limit;
  const filters = { categorySlug, search, min_price, max_price };
  const { where, values, joinCategory } = buildFilters(filters);
  const orderBy = buildSort(sort);

  const baseQuery = `FROM products p ${joinCategory ? 'JOIN categories c ON c.id = p.category_id' : ''} ${where}`;

  const itemsQuery = `SELECT p.* ${baseQuery} ${orderBy} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const itemsResult = await pool.query(itemsQuery, [...values, limit, offset]);

  const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, values);

  return {
    items: itemsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
  };
}

async function findBySlug(slug) {
  const result = await pool.query('SELECT * FROM products WHERE slug = $1 AND is_active = TRUE', [slug]);
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];
}

async function findByIds(ids) {
  if (!ids || !ids.length) return [];
  const result = await pool.query('SELECT * FROM products WHERE id = ANY($1)', [ids]);
  return result.rows;
}

async function listAdmin() {
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  return result.rows;
}

async function createProduct(data, client) {
  return runWithClient(client, async (db) => {
    const slug = data.slug || slugify(data.name_en || data.name_ar || '');
    const result = await db.query(
      `INSERT INTO products (
        category_id, name_ar, name_en, slug, description_ar, description_en,
        short_description_ar, short_description_en, price, old_price, cost_price,
        stock, low_stock_threshold, weight, dimensions, is_active, meta_title, meta_description
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,$15,$16,$17,$18
      ) RETURNING *`,
      [
        data.category_id || null,
        data.name_ar,
        data.name_en,
        slug,
        data.description_ar || null,
        data.description_en || null,
        data.short_description_ar || null,
        data.short_description_en || null,
        data.price,
        data.old_price || null,
        data.cost_price || null,
        data.stock || 0,
        data.low_stock_threshold || 5,
        data.weight || null,
        data.dimensions || null,
        data.is_active !== undefined ? data.is_active : true,
        data.meta_title || null,
        data.meta_description || null,
      ]
    );
    return result.rows[0];
  });
}

async function updateProduct(id, data, client) {
  return runWithClient(client, async (db) => {
    const slug = data.slug || slugify(data.name_en || data.name_ar || '');
    const result = await db.query(
      `UPDATE products
       SET category_id = $1,
           name_ar = $2,
           name_en = $3,
           slug = $4,
           description_ar = $5,
           description_en = $6,
           short_description_ar = $7,
           short_description_en = $8,
           price = $9,
           old_price = $10,
           cost_price = $11,
           stock = $12,
           low_stock_threshold = $13,
           weight = $14,
           dimensions = $15,
           is_active = $16,
           meta_title = $17,
           meta_description = $18,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $19
       RETURNING *`,
      [
        data.category_id || null,
        data.name_ar,
        data.name_en,
        slug,
        data.description_ar || null,
        data.description_en || null,
        data.short_description_ar || null,
        data.short_description_en || null,
        data.price,
        data.old_price || null,
        data.cost_price || null,
        data.stock || 0,
        data.low_stock_threshold || 5,
        data.weight || null,
        data.dimensions || null,
        data.is_active !== undefined ? data.is_active : true,
        data.meta_title || null,
        data.meta_description || null,
        id,
      ]
    );
    return result.rows[0];
  });
}

async function deleteProduct(id, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  });
}

async function countAll() {
  const result = await pool.query('SELECT COUNT(*) FROM products');
  return parseInt(result.rows[0].count, 10);
}

async function countLowStock() {
  const result = await pool.query(
    `SELECT COUNT(*) FROM products WHERE stock <= COALESCE(low_stock_threshold, 5)`
  );
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  listPublic,
  findBySlug,
  findById,
  findByIds,
  listAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  countAll,
  countLowStock,
};
