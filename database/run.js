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
    connectionString: process.env.DATABASE_URL,
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
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
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
