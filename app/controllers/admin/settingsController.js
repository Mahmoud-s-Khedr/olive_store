const Setting = require('../../models/Setting');
const { withTransaction } = require('../../utils/transaction');

async function list(req, res) {
  const settings = await Setting.getAll();
  res.json({ settings });
}

const allowedTypes = new Set(['string', 'number', 'boolean', 'json']);

async function update(req, res) {
  const updates = Array.isArray(req.body) ? req.body : [req.body];
  const results = await withTransaction(async (client) => {
    const updatedItems = [];
    for (const item of updates) {
      if (!item.key || typeof item.key !== 'string') {
        continue;
      }
      if (item.type && !allowedTypes.has(item.type)) {
        throw Object.assign(new Error(`Invalid type for key ${item.key}`), { status: 400 });
      }
      const updated = await Setting.updateSetting(item.key, item.value, item.type, item.group_name, client);
      updatedItems.push(updated);
    }
    return updatedItems;
  });
  res.json({ settings: results });
}

module.exports = {
  list,
  update,
};
