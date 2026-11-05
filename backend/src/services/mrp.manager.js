const { mrp } = require('./mrp.service');
const MrpModel = require('../models/model'); 

const procesarMrp = async (horizonte, item, periodo, qty) => {
  const items = await MrpModel.obtenerDatosMrp();
  
  if (!items[item]) {
    throw new Error(`El artículo '${item}' no existe en la base de datos.`);
  }

  const demanda = [{ item, periodo: Number(periodo), qty: Number(qty) }];
  const resultado = mrp(items, demanda, horizonte);

  const totalOrdenes = resultado.ordenes.length;
  const ordenesCompra = resultado.ordenes.filter(o => o.tipo === 'Compra').length;
  const ordenesProduccion = resultado.ordenes.filter(o => o.tipo === 'Producción').length;
  const ordenesAtrasadas = resultado.ordenes.filter(o => o.atrasada).length;

  return {
    ...resultado,
    kpis: {
      total_ordenes: totalOrdenes,
      ordenes_compra: ordenesCompra,
      ordenes_produccion: ordenesProduccion,
      ordenes_atrasadas: ordenesAtrasadas
    }
  };
};

module.exports = { procesarMrp };