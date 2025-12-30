const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const File = require('../models/File');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');
const { withTransaction } = require('../utils/transaction');

async function buildAndValidateItems(items) {
  if (!Array.isArray(items) || !items.length) return null;

  const productIds = [...new Set(items.map((i) => Number(i.product_id)).filter(Boolean))];
  const products = await Product.findByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  const normalized = [];
  for (const raw of items) {
    const productId = Number(raw.product_id);
    const quantity = Number(raw.quantity);
    if (!productId || !quantity || quantity <= 0) {
      continue;
    }
    const product = productMap.get(productId);
    if (!product) {
      throw Object.assign(new Error(`Product ${productId} not found`), { status: 400 });
    }
    if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
      throw Object.assign(new Error(`Insufficient stock for product ${productId}`), { status: 400 });
    }

    const price = Number(product.price);
    const lineTotal = Number((price * quantity).toFixed(2));
    normalized.push({
      product_id: productId,
      product_name_en: product.name_en,
      product_name_ar: product.name_ar,
      product_image: raw.product_image || null,
      quantity,
      price,
      total: lineTotal,
    });
  }

  return normalized.length ? normalized : null;
}

const create = asyncHandler(async (req, res) => {
  const { customer_name, phone, address, city, postal_code, notes, payment_method, shipping_cost = 0, discount = 0, items } = req.body;

  if (!customer_name || !phone || !address || !city || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const parsedItems = await buildAndValidateItems(items);
  if (!parsedItems || !parsedItems.length) {
    return res.status(400).json({ message: 'Items are required' });
  }

  const subtotal = parsedItems.reduce((sum, item) => sum + item.total, 0);
  const computedTotal = Number((subtotal + Number(shipping_cost || 0) - Number(discount || 0)).toFixed(2));
  if (computedTotal < 0) {
    return res.status(400).json({ message: 'Total cannot be negative' });
  }

  const order = await Order.createOrder(req.user.id, {
    customer_name,
    phone,
    address,
    city,
    postal_code,
    notes,
    payment_method,
    subtotal,
    shipping_cost: Number(shipping_cost || 0),
    discount: Number(discount || 0),
    total: computedTotal,
    email: req.user.email,
  }, parsedItems);

  await emailService.sendOrderConfirmationEmail(order, parsedItems);

  res.status(201).json({ order });
});

const list = asyncHandler(async (req, res) => {
  const orders = await Order.listForUser(req.user.id);
  res.json({ orders });
});

const getOne = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const order = await Order.findByOrderNumber(orderNumber);
  if (!order || order.user_id !== req.user.id) {
    return res.status(404).json({ message: 'Order not found' });
  }
  const items = await Order.listItems(order.id);
  const productIds = items.map((i) => i.product_id).filter(Boolean);
  const imagesMap = {};
  for (const pid of productIds) {
    imagesMap[pid] = await ProductImage.listByProduct(pid);
  }
  res.json({ order, items, images: imagesMap });
});

const uploadPaymentProof = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { r2_key, filename, original_name, mime_type, size, payment_reference } = req.body;
  if (!r2_key || !filename || !original_name || !mime_type || !size) {
    return res.status(400).json({ message: 'File metadata is required' });
  }

  const order = await Order.findByOrderNumber(orderNumber);
  if (!order || order.user_id !== req.user.id) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const { file, updated } = await withTransaction(async (client) => {
    const created = await File.createFile(
      { filename, original_name, mime_type, size, r2_key, uploaded_by: req.user.id },
      client
    );
    const saved = await Order.addPaymentProof(order.id, created.id, payment_reference, client);
    return { file: created, updated: saved };
  });
  res.json({ order: updated, file });
});

const cancel = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { reason } = req.body;
  const order = await Order.findByOrderNumber(orderNumber);
  if (!order || order.user_id !== req.user.id) {
    return res.status(404).json({ message: 'Order not found' });
  }
  const cancelled = await withTransaction((client) => Order.cancelOrder(order.id, reason, client));
  if (!cancelled) {
    return res.status(400).json({ message: 'Unable to cancel order' });
  }
  res.json({ order: cancelled });
});

module.exports = {
  create,
  list,
  getOne,
  uploadPaymentProof,
  cancel,
};
