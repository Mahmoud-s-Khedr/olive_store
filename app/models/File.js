const pool = require('../config/database');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

async function createFile(
  { filename, original_name, mime_type, size, r2_key, uploaded_by, entity_type, entity_id },
  client
) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `INSERT INTO files (filename, original_name, mime_type, size, r2_key, uploaded_by, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        filename,
        original_name,
        mime_type,
        size,
        r2_key,
        uploaded_by || null,
        entity_type || null,
        entity_id || null,
      ]
    );
    return result.rows[0];
  });
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
  return result.rows[0];
}

async function listFiles({ limit = 20, offset = 0 } = {}) {
  const result = await pool.query(
    'SELECT * FROM files ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

module.exports = {
  createFile,
  findById,
  listFiles,
};
