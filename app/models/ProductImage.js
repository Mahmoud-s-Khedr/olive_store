const pool = require('../config/database');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

async function addImage({ product_id, file_id, is_primary = false, sort_order = 0, alt_text_ar, alt_text_en }, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `INSERT INTO product_images (product_id, file_id, is_primary, sort_order, alt_text_ar, alt_text_en)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, file_id, is_primary, sort_order, alt_text_ar || null, alt_text_en || null]
    );
    return result.rows[0];
  });
}

async function listByProduct(productId) {
  const result = await pool.query(
    `SELECT pi.*, f.r2_key, f.filename, f.mime_type
     FROM product_images pi
     JOIN files f ON f.id = pi.file_id
     WHERE pi.product_id = $1
     ORDER BY pi.sort_order ASC, pi.id ASC`,
    [productId]
  );
  return result.rows;
}

async function setPrimary(productId, imageId, client) {
  return runWithClient(client, async (db) => {
    await db.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = $1', [productId]);
    const result = await db.query(
      `UPDATE product_images
       SET is_primary = TRUE
       WHERE id = $1 AND product_id = $2
       RETURNING *`,
      [imageId, productId]
    );
    return result.rows[0];
  });
}

async function removeImage(productId, imageId, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING id',
      [imageId, productId]
    );
    return result.rows[0];
  });
}

module.exports = {
  addImage,
  listByProduct,
  setPrimary,
  removeImage,
};
