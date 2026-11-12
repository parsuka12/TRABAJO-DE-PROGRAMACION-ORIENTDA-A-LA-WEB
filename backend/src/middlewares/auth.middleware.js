const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión'
    });
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.sub,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado'
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
}

module.exports = { auth, requireRole };