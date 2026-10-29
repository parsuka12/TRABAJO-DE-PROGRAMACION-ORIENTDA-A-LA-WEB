const test = require('node:test');
const assert = require('node:assert');
const { mrp, validar, nivelBajo, lote, MrpError } = require('../src/services/mrp.service');
 
const base = (o = {}) => ({ nombre: 'x', lead_time: 0, stock: 0, seguridad: 0, lote_min: 0, multiplo: 0, bom: [], recepciones: [], ...o });
 
test('requerimiento neto con inventario y lead time', () => {
  const items = {
    BICI: base({ lead_time: 1, stock: 10, bom: [{ item: 'RUEDA', qty: 2 }] }),
    RUEDA: base({ lead_time: 1, stock: 40 }),
  };
  const r = mrp(items, [{ item: 'BICI', periodo: 4, qty: 50 }], 8);
  const bici = r.ordenes.find((o) => o.item === 'BICI');
  assert.strictEqual(bici.qty, 40);
  assert.strictEqual(bici.lanzar, 3);
  assert.strictEqual(bici.recibir, 4);
  const rueda = r.ordenes.find((o) => o.item === 'RUEDA');
  assert.strictEqual(rueda.qty, 40); 
  assert.strictEqual(rueda.lanzar, 2);
});
 
test('ítem compartido por dos padres', () => {
  const items = {
    A: base({ bom: [{ item: 'T', qty: 2 }] }),
    B: base({ bom: [{ item: 'T', qty: 3 }] }),
    T: base({ stock: 10 }),
  };
  const r = mrp(items, [{ item: 'A', periodo: 2, qty: 5 }, { item: 'B', periodo: 2, qty: 5 }], 4);
  const t = r.ordenes.find((o) => o.item === 'T');
  assert.strictEqual(t.qty, 15);
});
 
test('detecta ciclos en el BOM', () => {
  const items = { A: base({ bom: [{ item: 'B', qty: 1 }] }), B: base({ bom: [{ item: 'A', qty: 1 }] }) };
  assert.throws(() => validar(items), MrpError);
});
 
test('recepción programada evita crear orden', () => {
  const items = { A: base({ stock: 0, recepciones: [{ periodo: 1, qty: 20 }] }) };
  const r = mrp(items, [{ item: 'A', periodo: 2, qty: 20 }], 4);
  assert.strictEqual(r.ordenes.length, 0);
});
 
test('lote mínimo y múltiplo', () => {
  assert.strictEqual(lote(7, base({ lote_min: 10 })), 10);
  assert.strictEqual(lote(23, base({ multiplo: 10 })), 30);
});
 
test('nivel bajo del ítem compartido', () => {
  const items = {
    P: base({ bom: [{ item: 'S', qty: 1 }, { item: 'T', qty: 1 }] }),
    S: base({ bom: [{ item: 'T', qty: 1 }] }),
    T: base(),
  };
  assert.deepStrictEqual(nivelBajo(items), { P: 0, S: 1, T: 2 });
});
 
test('marca orden atrasada', () => {
  const items = { A: base({ lead_time: 3 }) };
  const r = mrp(items, [{ item: 'A', periodo: 1, qty: 5 }], 4);
  assert.strictEqual(r.ordenes[0].atrasada, true);
});

test('ignora demandas negativas o fuera de horizonte', () => {
  const items = { A: base() };
  const r = mrp(items, [{ item: 'A', periodo: 1, qty: -5 }, { item: 'A', periodo: 10, qty: 5 }], 4);
  assert.strictEqual(r.ordenes.length, 0);
});

test('ordena compra directa si no hay BOM', () => {
  const items = { COMPRA: base({ lead_time: 1 }) };
  const r = mrp(items, [{ item: 'COMPRA', periodo: 2, qty: 10 }], 5);
  assert.strictEqual(r.ordenes[0].tipo, 'Compra');
  assert.strictEqual(r.ordenes[0].lanzar, 1);
});

test('suma multiples demandas en el mismo periodo', () => {
  const items = { A: base() };
  const r = mrp(items, [{ item: 'A', periodo: 1, qty: 5 }, { item: 'A', periodo: 1, qty: 7 }], 3);
  assert.strictEqual(r.items.A.bruto[1], 12);
});