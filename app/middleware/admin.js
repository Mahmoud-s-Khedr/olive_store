function admin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
}

module.exports = admin;
