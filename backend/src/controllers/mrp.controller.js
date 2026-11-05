const { procesarMrp } = require('../services/mrp.manager');

const calcularMrp = async (req, res) => {
  try {
    const { horizonte, item, periodo, qty } = req.body;
    const resultadoFinal = await procesarMrp(horizonte, item, periodo, qty);
    res.json(resultadoFinal);
  } catch (error) {
    console.error('Error en MRP:', error);
    if (error.message.includes('no existe')) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error al calcular el MRP', error: error.message });
  }
};

module.exports = { calcularMrp };