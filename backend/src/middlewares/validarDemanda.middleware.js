const validarDemanda = (req, res, next) => {
  const { horizonte, item, periodo, qty } = req.body;
  const errores = [];

  if (!horizonte || isNaN(horizonte) || horizonte <= 0) errores.push('El horizonte debe ser un número mayor a 0.');
  if (!item || typeof item !== 'string') errores.push('El código del ítem es obligatorio y debe ser texto.');
  if (periodo === undefined || isNaN(periodo) || periodo < 0) errores.push('El periodo debe ser un número mayor o igual a 0.');
  if (qty === undefined || isNaN(qty) || qty <= 0) errores.push('La cantidad (qty) debe ser un número mayor a 0.');

  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos de demanda inválidos', detalles: errores });
  }

  next();
};

module.exports = { validarDemanda };