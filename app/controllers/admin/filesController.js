const File = require('../../models/File');

async function list(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const files = await File.listFiles({ limit, offset });
  res.json({ files, meta: { page, limit } });
}

async function upload(req, res) {
  const { r2_key, filename, original_name, mime_type, size, entity_type, entity_id } = req.body;
  const file = await File.createFile({
    filename,
    original_name,
    mime_type,
    size,
    r2_key,
    uploaded_by: req.user.id,
    entity_type,
    entity_id,
  });
  res.status(201).json({ file });
}

async function remove(req, res) {
  res.status(501).json({ message: 'File deletion not implemented' });
}

module.exports = {
  list,
  upload,
  remove,
};
