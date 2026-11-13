const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { mensaje: 'Demasiadas peticiones desde esta IP, intentá más tarde.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { mensaje: 'Demasiados intentos de login. Bloqueado por 15 minutos.' }
});

module.exports = { apiLimiter, loginLimiter };