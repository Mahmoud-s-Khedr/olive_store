require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const runSeed = require('./seed');

const action = process.argv[2];

const schemaPath = path.join(__dirname, 'schema.sql');

async function runSql(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8').trim();
  if (!sql) {
    console.log(`Skipping empty file: ${filePath}`);
    return;
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log('DEBUG run.js: Connecting with:', {
    user: client.user,
    host: client.host,
    database: client.database,
    port: client.port,
    // password: client.password ? '***' : 'missing' 
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied ${path.basename(filePath)}`);
  } finally {
    await client.end();
  }
}

async function main() {
  if (!process.env.DB_NAME) {
    console.error('Database environment variables (DB_NAME, etc.) are not set');
    process.exit(1);
  }

  if (action === 'schema') {
    await runSql(schemaPath);
    return;
  }

  if (action === 'seed') {
    await runSeed();
    return;
  }

  if (action === 'all') {
    await runSql(schemaPath);
    await runSeed();
    return;
  }

  console.error('Usage: node database/run.js <schema|seed|all>');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
