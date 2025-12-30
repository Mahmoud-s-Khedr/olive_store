const pool = require('../config/database');
const slugify = require('../utils/slugify');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

async function listActive() {
  const result = await pool.query(
    `SELECT id, name_ar, name_en, slug, description_ar, description_en, parent_id, sort_order
     FROM categories
     WHERE is_active = TRUE
     ORDER BY sort_order ASC, id ASC`
  );
  return result.rows;
}

async function listAll() {
  const result = await pool.query(
    `SELECT id, name_ar, name_en, slug, description_ar, description_en, parent_id, sort_order, is_active
     FROM categories
     ORDER BY sort_order ASC, id ASC`
  );
  return result.rows;
}

async function findBySlug(slug) {
  const result = await pool.query(
    `SELECT id, name_ar, name_en, slug, description_ar, description_en, parent_id, sort_order, is_active
     FROM categories
     WHERE slug = $1`,
    [slug]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0];
}

async function createCategory(data, client) {
  return runWithClient(client, async (db) => {
    const slug = data.slug || slugify(data.name_en || data.name_ar || '');
    const result = await db.query(
      `INSERT INTO categories (name_ar, name_en, slug, description_ar, description_en, parent_id, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.name_ar,
        data.name_en,
        slug,
        data.description_ar || null,
        data.description_en || null,
        data.parent_id || null,
        data.sort_order || 0,
        data.is_active !== undefined ? data.is_active : true,
      ]
    );
    return result.rows[0];
  });
}

async function updateCategory(id, data, client) {
  return runWithClient(client, async (db) => {
    const slug = data.slug || slugify(data.name_en || data.name_ar || '');
    const result = await db.query(
      `UPDATE categories
       SET name_ar = $1,
           name_en = $2,
           slug = $3,
           description_ar = $4,
           description_en = $5,
           parent_id = $6,
           sort_order = $7,
           is_active = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        data.name_ar,
        data.name_en,
        slug,
        data.description_ar || null,
        data.description_en || null,
        data.parent_id || null,
        data.sort_order || 0,
        data.is_active !== undefined ? data.is_active : true,
        id,
      ]
    );
    return result.rows[0];
  });
}

async function deleteCategory(id, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  });
}

module.exports = {
  listActive,
  listAll,
  findBySlug,
  findById,
  createCategory,
  updateCategory,
  deleteCategory,
};
