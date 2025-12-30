/**
 * Views Routes - Server-side rendering for EJS templates
 */
const express = require('express');
const router = express.Router();

// Store Pages
router.get('/', (req, res) => {
    res.render('pages/index', { title: 'الرئيسية', currentPage: 'home' });
});

router.get('/products', (req, res) => {
    res.render('pages/products', { title: 'المنتجات', currentPage: 'products' });
});

router.get('/categories', (req, res) => {
    res.render('pages/categories', { title: 'التصنيفات', currentPage: 'categories' });
});

router.get('/products/:slug', (req, res) => {
    res.render('pages/product', { title: 'تفاصيل المنتج', currentPage: 'products' });
});

router.get('/cart', (req, res) => {
    res.render('pages/cart', { title: 'سلة التسوق', currentPage: 'cart' });
});

router.get('/checkout', (req, res) => {
    res.render('pages/checkout', { title: 'إتمام الطلب', currentPage: 'checkout' });
});

router.get('/order-success', (req, res) => {
    res.render('pages/order-success', { title: 'تم الطلب بنجاح' });
});

router.get('/my-orders', (req, res) => {
    res.render('pages/my-orders', { title: 'طلباتي', currentPage: 'orders' });
});

router.get('/order/:id', (req, res) => {
    res.render('pages/order-detail', { title: 'تفاصيل الطلب', currentPage: 'orders' });
});

// Auth Pages
router.get('/login', (req, res) => {
    res.render('pages/login', { title: 'تسجيل الدخول' });
});

router.get('/register', (req, res) => {
    res.render('pages/register', { title: 'إنشاء حساب' });
});

router.get('/forgot-password', (req, res) => {
    res.render('pages/forgot-password', { title: 'استعادة كلمة المرور' });
});

router.get('/reset-password', (req, res) => {
    res.render('pages/reset-password', { title: 'إعادة تعيين كلمة المرور' });
});

router.get('/verify-email', (req, res) => {
    res.render('pages/verify-email', { title: 'تأكيد البريد الإلكتروني' });
});

router.get('/profile', (req, res) => {
    res.render('pages/profile', { title: 'الملف الشخصي', currentPage: 'profile' });
});

// Static Pages
router.get('/about', (req, res) => {
    res.render('pages/about', { title: 'من نحن', currentPage: 'about' });
});

router.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'تواصل معنا', currentPage: 'contact' });
});

router.get('/shipping', (req, res) => {
    res.render('pages/shipping', { title: 'الشحن والتوصيل' });
});

router.get('/payment-info', (req, res) => {
    res.render('pages/payment-info', { title: 'طرق الدفع' });
});

router.get('/terms', (req, res) => {
    res.render('pages/terms', { title: 'الشروط والأحكام' });
});

// Admin Pages
router.get('/admin/login', (req, res) => {
    res.render('admin/login', { title: 'تسجيل الدخول - لوحة التحكم', layout: false });
});

router.get('/admin', (req, res) => {
    res.render('admin/index', { title: 'لوحة التحكم', currentPage: 'dashboard', layout: 'layouts/admin' });
});

router.get('/admin/products', (req, res) => {
    res.render('admin/products', { title: 'المنتجات', currentPage: 'products', layout: 'layouts/admin' });
});

router.get('/admin/products/new', (req, res) => {
    res.render('admin/product-form', { title: 'إضافة منتج', currentPage: 'products', layout: 'layouts/admin' });
});

router.get('/admin/products/:id/edit', (req, res) => {
    res.render('admin/product-form', { title: 'تعديل المنتج', currentPage: 'products', layout: 'layouts/admin' });
});

router.get('/admin/categories/new', (req, res) => {
    res.render('admin/category-form', { title: 'إضافة فئة', currentPage: 'categories', layout: 'layouts/admin' });
});

router.get('/admin/categories/:id/edit', (req, res) => {
    res.render('admin/category-form', { title: 'تعديل الفئة', currentPage: 'categories', layout: 'layouts/admin' });
});

router.get('/admin/categories', (req, res) => {
    res.render('admin/categories', { title: 'الفئات', currentPage: 'categories', layout: 'layouts/admin' });
});

router.get('/admin/orders', (req, res) => {
    res.render('admin/orders', { title: 'الطلبات', currentPage: 'orders', layout: 'layouts/admin' });
});

router.get('/admin/orders/:id', (req, res) => {
    res.render('admin/order-detail', { title: 'تفاصيل الطلب', currentPage: 'orders', layout: 'layouts/admin' });
});

router.get('/admin/customers', (req, res) => {
    res.render('admin/customers', { title: 'العملاء', currentPage: 'customers', layout: 'layouts/admin' });
});

router.get('/admin/files', (req, res) => {
    res.render('admin/files', { title: 'الملفات', currentPage: 'files', layout: 'layouts/admin' });
});

router.get('/admin/settings', (req, res) => {
    res.render('admin/settings', { title: 'الإعدادات', currentPage: 'settings', layout: 'layouts/admin' });
});

module.exports = router;
