const Setting = require('../models/Setting');

async function getPublic(req, res) {
  const settings = await Setting.getPublicSettings();
  res.json({ settings });
}

module.exports = {
  getPublic,
};
