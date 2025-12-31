/**
 * Views Routes - Serve static HTML files
 */
const express = require('express');
const path = require('path');
const router = express.Router();

// Store Pages
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/index.html'));
});

router.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/products.html'));
});

router.get('/categories', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/categories.html'));
});

router.get('/products/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/product.html'));
});

router.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/cart.html'));
});

router.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/checkout.html'));
});

router.get('/order-success', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/order-success.html'));
});

router.get('/my-orders', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/my-orders.html'));
});

router.get('/order/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/order-detail.html'));
});

// Auth Pages
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/login.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/register.html'));
});

router.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/forgot-password.html'));
});

router.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/reset-password.html'));
});

router.get('/verify-email', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/verify-email.html'));
});

router.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/profile.html'));
});

// Static Pages
router.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/about.html'));
});

router.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/contact.html'));
});

router.get('/shipping', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/shipping.html'));
});

router.get('/payment-info', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/payment-info.html'));
});

router.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/terms.html'));
});

// Admin Pages
router.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-login.html'));
});

router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-dashboard.html'));
});

router.get('/admin/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-products.html'));
});

router.get('/admin/products/new', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-product-form.html'));
});

router.get('/admin/products/:id/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-product-form.html'));
});

router.get('/admin/categories/new', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-category-form.html'));
});

router.get('/admin/categories/:id/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-category-form.html'));
});

router.get('/admin/categories', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-categories.html'));
});

router.get('/admin/orders', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-orders.html'));
});

router.get('/admin/orders/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-order-detail.html'));
});

router.get('/admin/customers', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-customers.html'));
});

router.get('/admin/files', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-files.html'));
});

router.get('/admin/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/admin-settings.html'));
});

module.exports = router;
