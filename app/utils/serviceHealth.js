const pool = require('../config/database');
const createR2Client = require('../config/r2');
const createResendClient = require('../config/resend');
const { HeadBucketCommand } = require('@aws-sdk/client-s3');

function baseResult() {
  return {
    ok: false,
    configured: false,
    details: '',
  };
}

async function checkDatabase() {
  const result = baseResult();
  if (!process.env.DATABASE_URL) {
    result.details = 'DATABASE_URL is not set';
    return result;
  }
  result.configured = true;
  try {
    await pool.query('SELECT 1');
    result.ok = true;
    result.details = 'Connected';
  } catch (err) {
    result.details = err.message;
  }
  return result;
}

async function checkR2() {
  const result = baseResult();
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    result.details = `Missing env: ${missing.join(', ')}`;
    return result;
  }
  result.configured = true;
  try {
    const client = createR2Client();
    const command = new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME });
    await client.send(command);
    result.ok = true;
    result.details = 'Bucket accessible';
  } catch (err) {
    result.details = err.message;
  }
  return result;
}

async function checkResend() {
  const result = baseResult();
  if (!process.env.RESEND_API_KEY) {
    result.details = 'RESEND_API_KEY is not set';
    return result;
  }
  result.configured = true;
  try {
    const resend = createResendClient();
    if (resend.domains && typeof resend.domains.list === 'function') {
      await resend.domains.list();
      result.ok = true;
      result.details = 'API reachable';
    } else if (resend.apiKeys && typeof resend.apiKeys.list === 'function') {
      await resend.apiKeys.list();
      result.ok = true;
      result.details = 'API reachable';
    } else {
      result.ok = true;
      result.details = 'Client initialized';
    }
  } catch (err) {
    result.details = err.message;
  }
  return result;
}

async function checkServices() {
  const [database, r2, resend] = await Promise.all([
    checkDatabase(),
    checkR2(),
    checkResend(),
  ]);

  const ok = database.ok && r2.ok && resend.ok;
  return { ok, database, r2, resend };
}

module.exports = {
  checkServices,
};
