
const { mrp } = require('../services/mrp.service');

const calcularMrp = async (req, res) => {
  try {
    const horizonte = Number(req.body.horizonte) || 12;

    // Validar el horizonte de planificación
    if (!Number.isInteger(horizonte) || horizonte < 1 || horizonte > 60) {
      return res.status(400).json({
        mensaje: 'El horizonte debe ser un número entero entre 1 y 60.'
      });
    }

    // Datos de artículos de ejemplo
    const items = {
      BICI: {
        nombre: 'Bicicleta',
        lead_time: 1,
        stock: 10,
        seguridad: 5,
        lote_min: 10,
        multiplo: 5,
        bom: [{ item: 'RUEDA', qty: 2 }],
        recepciones: []
      },
      RUEDA: {
        nombre: 'Rueda',
        lead_time: 2,
        stock: 20,
        seguridad: 10,
        lote_min: 50,
        multiplo: 10,
        bom: [],
        recepciones: []
      }
    };

    // Recibir demandas desde el frontend
    // Se conserva una demanda de ejemplo para no romper la pantalla actual
    const demanda = req.body.demanda || [
      { item: 'BICI', periodo: 4, qty: 50 }
    ];

    // Validar las demandas recibidas
    if (!Array.isArray(demanda) || demanda.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe enviar al menos una demanda.'
      });
    }

    for (const d of demanda) {
      if (!d.item || !items[d.item]) {
        return res.status(400).json({
          mensaje: `El artículo ${d.item || 'indicado'} no existe.`
        });
      }

      if (
        !Number.isInteger(d.periodo) ||
        d.periodo < 0 ||
        d.periodo >= horizonte
      ) {
        return res.status(400).json({
          mensaje: `El período de ${d.item} debe estar entre 0 y ${horizonte - 1}.`
        });
      }

      if (!Number.isFinite(d.qty) || d.qty <= 0) {
        return res.status(400).json({
          mensaje: `La cantidad de ${d.item} debe ser mayor que cero.`
        });
      }
    }

    // Ejecutar el algoritmo MRP
    const resultado = mrp(items, demanda, horizonte);

    res.json(resultado);

  } catch (error) {
    console.error('Error en MRP:', error);

    res.status(500).json({
      mensaje: 'Error al calcular el MRP',
      error: error.message
    });
  }
};

module.exports = { calcularMrp };
