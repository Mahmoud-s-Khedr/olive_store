const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const addressesRoutes = require('./routes/addresses');
const adminRoutes = require('./routes/admin');
const viewsRoutes = require('./routes/views');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { checkServices } = require('./utils/serviceHealth');

const app = express();

// Static files
app.use(express.static(path.join(__dirname, '../public')));

const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 50),
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WRITE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_WRITE_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Helmet with CSP allowing CDN resources
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :req[x-request-id]', {
    stream: process.stdout,
  })
);
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/services', async (req, res) => {
  const result = await checkServices();
  res.json(result);
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', writeLimiter, filesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', writeLimiter, ordersRoutes);
app.use('/api/settings', writeLimiter, settingsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/admin', writeLimiter, adminRoutes);

// View Routes (must be after API routes)
app.use('/', viewsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
