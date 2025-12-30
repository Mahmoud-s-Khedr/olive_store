const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const createR2Client = require('../config/r2');

async function getSignedUploadUrl({ keyPrefix = 'products', filename, contentType }) {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not set');
  }

  const client = createR2Client();
  const ext = filename && filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
  const key = `${keyPrefix}/${crypto.randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });

  const url = await getSignedUrl(client, command, { expiresIn: 15 * 60 });

  return {
    key,
    uploadUrl: url,
    publicUrl: process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${key}` : undefined,
  };
}

module.exports = {
  getSignedUploadUrl,
};
