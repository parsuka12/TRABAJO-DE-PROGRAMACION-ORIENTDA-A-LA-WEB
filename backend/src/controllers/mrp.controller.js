const { procesarMrp } = require('../services/mrp.manager');

const calcularMrp = async (req, res) => {
  try {
    const { horizonte, item } = req.body;

    if (!horizonte || isNaN(horizonte) || horizonte <= 0) {
      return res.status(400).json({ mensaje: 'El horizonte debe ser un número mayor a 0.' });
    }

    const resultadoFinal = await procesarMrp(horizonte, item || null);
    res.json(resultadoFinal);
  } catch (error) {
    console.error('Error en MRP:', error);
    if (error.message.includes('no existe') || error.message.includes('No hay demandas')) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error al calcular el MRP', error: error.message });
  }
};

module.exports = { calcularMrp };