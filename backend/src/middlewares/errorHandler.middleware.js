const errorHandler = (err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({
    mensaje: 'Ocurrió un error interno en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
};

module.exports = { errorHandler };