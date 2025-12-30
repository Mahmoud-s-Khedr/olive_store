const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function addHours(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

module.exports = {
  generateToken,
  addHours,
};
