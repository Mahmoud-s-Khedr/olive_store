const pool = require('../config/database');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

async function getPublicSettings() {
  const result = await pool.query(
    `SELECT key, value, type, group_name
     FROM settings
     WHERE group_name IN ('general', 'shipping', 'payment')`
  );
  return result.rows;
}

async function getAll() {
  const result = await pool.query('SELECT key, value, type, group_name FROM settings');
  return result.rows;
}

async function updateSetting(key, value, type, group, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `INSERT INTO settings (key, value, type, group_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type, group_name = EXCLUDED.group_name, updated_at = CURRENT_TIMESTAMP
       RETURNING key, value, type, group_name`,
      [key, value, type || 'string', group || 'general']
    );
    return result.rows[0];
  });
}

module.exports = {
  getPublicSettings,
  getAll,
  updateSetting,
};
