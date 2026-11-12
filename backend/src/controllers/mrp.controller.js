const { procesarMrp } = require('../services/mrp.manager');
const CorridasRepository = require('../repositories/corridas.repository');
const { MrpError } = require('../services/mrp.service');

const calcularMrp = async (req, res) => {
  try {
    const { horizonte, item, usuarioId } = req.body;

    const h = Number(horizonte);
    if (!Number.isInteger(h) || h < 1 || h > 52) {
      return res.status(400).json({ mensaje: 'El horizonte debe ser un entero entre 1 y 52.' });
    }

    const resultadoFinal = await procesarMrp(h, item || null);

    await CorridasRepository.guardar(h, usuarioId || null, resultadoFinal);

    res.json(resultadoFinal);
  } catch (error) {
    console.error('Error en MRP:', error);
    
    if (error instanceof MrpError) {
      return res.status(400).json({ mensaje: `Error en BOM: ${error.message}` });
    }
    if (error.message.includes('no existe') || error.message.includes('No hay demandas')) {
      return res.status(404).json({ mensaje: error.message });
    }
    
    res.status(500).json({ mensaje: 'Error al calcular el MRP', error: error.message });
  }
};

module.exports = { calcularMrp };