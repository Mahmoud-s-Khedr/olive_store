function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const requestId = req.id;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} id=${requestId}`, err);

  const payload = { message, requestId };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
