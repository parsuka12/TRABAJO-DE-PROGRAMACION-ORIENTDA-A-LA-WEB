// Lee de PostgreSQL los datos que necesita el motor MRP y los convierte
// al formato de mrp.service.js:
//   items   = { CODIGO: { nombre, lead_time, stock, seguridad, lote_min, multiplo, bom: [{ item, qty }], recepciones: [{ periodo, qty }] } }
//   demanda = [{ item, periodo, qty }]

// Funcion pura (no usa la base): convierte filas de las tablas al formato del motor.
// PostgreSQL devuelve los NUMERIC como texto ("10.00"), por eso se usa Number().
function armarDatosMrp(articulos, bom, demandas, recepciones) {
  const codigoPorId = {};
  const items = {};

  for (const a of articulos) {
    codigoPorId[a.id] = a.codigo;
    items[a.codigo] = {
      nombre: a.nombre,
      lead_time: Number(a.tiempo_entrega),
      stock: Number(a.stock),
      seguridad: Number(a.stock_seguridad),
      lote_min: Number(a.lote_minimo),
      multiplo: Number(a.multiplo),
      bom: [],
      recepciones: [],
    };
  }

  for (const b of bom) {
    const padre = codigoPorId[b.articulo_id];
    const hijo = codigoPorId[b.componente_id];
    if (padre && hijo) items[padre].bom.push({ item: hijo, qty: Number(b.cantidad) });
  }

  for (const r of recepciones) {
    const codigo = codigoPorId[r.articulo_id];
    if (codigo) items[codigo].recepciones.push({ periodo: Number(r.periodo), qty: Number(r.cantidad) });
  }

  const demanda = [];
  for (const d of demandas) {
    const codigo = codigoPorId[d.articulo_id];
    if (codigo) demanda.push({ item: codigo, periodo: Number(d.periodo), qty: Number(d.cantidad) });
  }

  return { items, demanda };
}

// Consulta las cuatro tablas y devuelve { items, demanda } listos para mrp().
// El parametro db permite probarla con una base falsa; por defecto usa el pool real.
async function obtenerDatosMrp(db) {
  const pool = db || require('../config/db');
  const articulos = await pool.query(
    'SELECT id, codigo, nombre, stock, stock_seguridad, tiempo_entrega, lote_minimo, multiplo FROM articulos'
  );
  const bom = await pool.query('SELECT articulo_id, componente_id, cantidad FROM bom');
  const demandas = await pool.query('SELECT articulo_id, periodo, cantidad FROM demandas');
  const recepciones = await pool.query('SELECT articulo_id, periodo, cantidad FROM recepciones');
  return armarDatosMrp(articulos.rows, bom.rows, demandas.rows, recepciones.rows);
}

module.exports = { armarDatosMrp, obtenerDatosMrp };