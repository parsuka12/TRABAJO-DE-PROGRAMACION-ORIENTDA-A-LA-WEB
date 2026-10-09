const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Sesión inválida o vencida' });
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ success: false, message: 'Tu rol no permite esta acción' });

module.exports = { auth, requireRole };
