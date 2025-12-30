const express = require('express');

const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const ordersRoutes = require('./orders');
const customersRoutes = require('./customers');
const filesRoutes = require('./files');
const settingsRoutes = require('./settings');
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');

const router = express.Router();

router.use(auth, admin);

router.use('/dashboard', dashboardRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/customers', customersRoutes);
router.use('/files', filesRoutes);
router.use('/settings', settingsRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'Admin API' });
});

module.exports = router;
