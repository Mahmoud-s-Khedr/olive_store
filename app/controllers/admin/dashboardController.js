const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');

async function summary(req, res) {
  const [metrics, customers] = await Promise.all([
    Order.getMetricsSummary(),
    User.countAll ? User.countAll() : null,
  ]);

  const recent = await Order.listAdmin({ page: 1, limit: 5 });

  res.json({
    totalSales: Number(metrics.revenue_all || 0),
    totalOrders: Number(metrics.total_orders || 0),
    totalProducts: await Product.countAll(),
    totalCustomers: customers || 0,
    pendingOrders: Number(metrics.pending_orders || 0),
    lowStockProducts: await Product.countLowStock(),
    recent_orders: recent.items || [],
  });
}

module.exports = {
  summary,
};
