const test = require('node:test');
const assert = require('node:assert');
const { armarDatosMrp, obtenerDatosMrp } = require('../src/models/mrp.model');
const { mrp } = require('../src/services/mrp.service');

// Filas tal como las devuelve PostgreSQL con los datos de docs/datos_ejemplo.sql
// (los NUMERIC llegan como texto).
const articulos = [
  { id: 3, codigo: 'BICI', nombre: 'Bicicleta', stock: '10.00', stock_seguridad: '0.00', tiempo_entrega: 1, lote_minimo: '0.00', multiplo: '1.00' },
  { id: 4, codigo: 'RUEDA', nombre: 'Rueda', stock: '40.00', stock_seguridad: '0.00', tiempo_entrega: 1, lote_minimo: '0.00', multiplo: '1.00' },
  { id: 5, codigo: 'CUADRO', nombre: 'Cuadro', stock: '15.00', stock_seguridad: '0.00', tiempo_entrega: 2, lote_minimo: '0.00', multiplo: '1.00' },
];
const bom = [
  { articulo_id: 3, componente_id: 4, cantidad: '2.00' },
  { articulo_id: 3, componente_id: 5, cantidad: '1.00' },
];
const demandas = [{ articulo_id: 3, periodo: 4, cantidad: '50.00' }];

test('convierte las filas de la base al formato del motor', () => {
  const { items, demanda } = armarDatosMrp(articulos, bom, demandas, []);
  assert.strictEqual(items.BICI.stock, 10); // numero, no texto
  assert.deepStrictEqual(items.BICI.bom, [{ item: 'RUEDA', qty: 2 }, { item: 'CUADRO', qty: 1 }]);
  assert.deepStrictEqual(demanda, [{ item: 'BICI', periodo: 4, qty: 50 }]);
});

test('con los datos de ejemplo el MRP da 40, 40 y 25', () => {
  const { items, demanda } = armarDatosMrp(articulos, bom, demandas, []);
  const r = mrp(items, demanda, 8);
  const orden = (c) => r.ordenes.find((o) => o.item === c);
  assert.strictEqual(orden('BICI').qty, 40);
  assert.strictEqual(orden('BICI').lanzar, 3);
  assert.strictEqual(orden('RUEDA').qty, 40);
  assert.strictEqual(orden('RUEDA').lanzar, 2);
  assert.strictEqual(orden('CUADRO').qty, 25);
  assert.strictEqual(orden('CUADRO').lanzar, 1);
});

test('una recepcion programada reduce la orden de la rueda', () => {
  const recepciones = [{ articulo_id: 4, periodo: 2, cantidad: '20.00' }];
  const { items, demanda } = armarDatosMrp(articulos, bom, demandas, recepciones);
  const r = mrp(items, demanda, 8);
  assert.strictEqual(r.ordenes.find((o) => o.item === 'RUEDA').qty, 20);
});

test('obtenerDatosMrp consulta las cuatro tablas', async () => {
  const consultas = [];
  const dbFalsa = {
    query: async (sql) => {
      consultas.push(sql);
      if (sql.includes('FROM articulos')) return { rows: articulos };
      if (sql.includes('FROM bom')) return { rows: bom };
      if (sql.includes('FROM demandas')) return { rows: demandas };
      return { rows: [] };
    },
  };
  const { items } = await obtenerDatosMrp(dbFalsa);
  assert.strictEqual(consultas.length, 4);
  assert.ok(items.RUEDA);
});