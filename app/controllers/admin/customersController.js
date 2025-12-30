const Order = require('../../models/Order');
const User = require('../../models/User');

async function list(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const result = await Order.listCustomerSummaries({ page, limit });
  res.json(result);
}

async function getOrders(req, res) {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const orders = await Order.listByCustomer(userId);
  res.json({ user, orders });
}

module.exports = {
  list,
  getOrders,
};
