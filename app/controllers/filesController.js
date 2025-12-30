const uploadService = require('../services/uploadService');

async function getUploadUrl(req, res) {
  const { file_name, content_type, key_prefix } = req.body;
  if (!file_name) {
    return res.status(400).json({ message: 'file_name is required' });
  }
  const signed = await uploadService.getSignedUploadUrl({
    keyPrefix: key_prefix || 'products',
    filename: file_name,
    contentType: content_type,
  });
  res.json(signed);
}

module.exports = {
  getUploadUrl,
};
