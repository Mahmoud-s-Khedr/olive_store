const pool = require('../config/database');
const { withTransaction } = require('../utils/transaction');

function runWithClient(client, work) {
  return client ? work(client) : withTransaction(work);
}

async function createUser({
  name,
  email,
  phone,
  hashedPassword,
  emailToken,
  emailTokenExpires,
}, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `INSERT INTO users
        (name, email, phone, hashed_password, email_token, email_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, is_admin, email_verified, created_at`,
      [name, email, phone, hashedPassword, emailToken, emailTokenExpires]
    );

    return result.rows[0];
  });
}

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function findByPhone(phone) {
  const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, phone, is_admin, email_verified, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function findByIdWithPassword(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

async function countAll() {
  const result = await pool.query('SELECT COUNT(*) FROM users');
  return parseInt(result.rows[0].count, 10);
}

async function findByEmailToken(token) {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE email_token = $1 AND email_token_expires > NOW()`,
    [token]
  );
  return result.rows[0];
}

async function setEmailToken(id, token, expires, client) {
  return runWithClient(client, async (db) => {
    await db.query(
      `UPDATE users
       SET email_token = $1, email_token_expires = $2
       WHERE id = $3`,
      [token, expires, id]
    );
  });
}

async function verifyEmail(id, client) {
  return runWithClient(client, async (db) => {
    await db.query(
      `UPDATE users
       SET email_verified = TRUE, email_token = NULL, email_token_expires = NULL
       WHERE id = $1`,
      [id]
    );
  });
}

async function setPasswordResetToken(id, token, expires, client) {
  return runWithClient(client, async (db) => {
    await db.query(
      `UPDATE users
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [token, expires, id]
    );
  });
}

async function findByPasswordResetToken(token) {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
    [token]
  );
  return result.rows[0];
}

async function updatePassword(id, hashedPassword, client) {
  return runWithClient(client, async (db) => {
    await db.query(
      `UPDATE users
       SET hashed_password = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, id]
    );
  });
}

async function updateProfile(id, { name, phone }, client) {
  return runWithClient(client, async (db) => {
    const result = await db.query(
      `UPDATE users
       SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, email, phone, is_admin, email_verified, created_at, updated_at`,
      [name, phone, id]
    );
    return result.rows[0];
  });
}

module.exports = {
  createUser,
  findByEmail,
  findByPhone,
  findById,
  findByEmailToken,
  setEmailToken,
  verifyEmail,
  setPasswordResetToken,
  findByPasswordResetToken,
  updatePassword,
  updateProfile,
  findByIdWithPassword,
  countAll,
};
