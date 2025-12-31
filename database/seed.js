const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function runSeed() {
  if (!process.env.DB_NAME) {
    throw new Error('Database environment variables (DB_NAME, etc.) are required to seed the database');
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is required to seed the database');
  }

  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPhone = process.env.ADMIN_PHONE || '+200000000000';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  try {
    const result = await client.query(
      `
        INSERT INTO users (name, email, phone, hashed_password, email_verified, phone_verified, is_admin)
        VALUES ($1, $2, $3, $4, TRUE, TRUE, TRUE)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          hashed_password = EXCLUDED.hashed_password,
          email_verified = TRUE,
          phone_verified = TRUE,
          is_admin = TRUE,
          updated_at = NOW()
        RETURNING id;
      `,
      [adminName, adminEmail, adminPhone, hashedPassword]
    );

    console.log(`Seeded admin user (id: ${result.rows[0].id})`);
  } finally {
    await client.end();
  }
}

module.exports = runSeed;

if (require.main === module) {
  runSeed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
