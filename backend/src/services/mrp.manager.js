const { mrp } = require('./mrp.service');
const MrpModel = require('../models/model');

const procesarMrp = async (horizonte, filtroArticulo = null) => {
  const { items, demanda } = await MrpModel.obtenerDatosMrp();

  // Si se especifica un filtro de artículo, usar solo sus demandas
  let demandaFiltrada = demanda;
  if (filtroArticulo) {
    if (!items[filtroArticulo]) {
      throw new Error(`El artículo '${filtroArticulo}' no existe en la base de datos.`);
    }
    demandaFiltrada = demanda.filter(d => d.item === filtroArticulo);
    if (demandaFiltrada.length === 0) {
      throw new Error(`No hay demandas registradas para el artículo '${filtroArticulo}'.`);
    }
  }

  if (demandaFiltrada.length === 0) {
    throw new Error('No hay demandas registradas en la base de datos para calcular el MRP.');
  }

  const resultado = mrp(items, demandaFiltrada, horizonte);

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
    },
    demanda_utilizada: demandaFiltrada
  };
};

module.exports = { procesarMrp };