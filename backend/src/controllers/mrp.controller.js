const { mrp } = require('../services/mrp.service');

const calcularMrp = async (req, res) => {
  try {
    const horizonte = Number(req.body.horizonte) || 12;

    // DATOS DE EJEMPLO (MOCK)
    // La Persona 1 reemplazará esto por consultas a PostgreSQL más adelante
    const items = {
      BICI: { nombre: 'Bicicleta', lead_time: 1, stock: 10, seguridad: 5, lote_min: 10, multiplo: 5, bom: [{ item: 'RUEDA', qty: 2 }], recepciones: [] },
      RUEDA: { nombre: 'Rueda', lead_time: 2, stock: 20, seguridad: 10, lote_min: 50, multiplo: 10, bom: [], recepciones: [] }
    };
    const demanda = [
      { item: 'BICI', periodo: 4, qty: 50 }
    ];

    const resultado = mrp(items, demanda, horizonte);
    res.json(resultado);
  } catch (error) {
    console.error('Error en MRP:', error);
    res.status(500).json({ mensaje: 'Error al calcular el MRP', error: error.message });
  }
};

module.exports = { calcularMrp };