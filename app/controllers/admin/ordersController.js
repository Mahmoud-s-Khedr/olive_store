const Order = require('../../models/Order');
const User = require('../../models/User');
const { withTransaction } = require('../../utils/transaction');

async function list(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const { status, payment_status } = req.query;
  const result = await Order.listAdmin({ page, limit, status, payment_status });
  res.json(result);
}

async function getOne(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  const items = await Order.listItems(order.id);
  const user = order.user_id ? await User.findById(order.user_id) : null;
  res.json({ order, items, user });
}

async function updateStatus(req, res) {
  const { status, payment_status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  let updated = order;
  if (status || payment_status) {
    updated = await withTransaction(async (client) => {
      let current = order;
      if (status) {
        current = await Order.updateStatus(order.id, status, client);
      }
      if (payment_status) {
        current = await Order.updatePaymentStatus(order.id, payment_status, client);
      }
      return current;
    });
  }
  res.json({ order: updated });
}

module.exports = {
  list,
  getOne,
  updateStatus,
};
