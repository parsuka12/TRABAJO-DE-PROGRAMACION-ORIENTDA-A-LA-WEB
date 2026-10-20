const test = require('node:test');
const assert = require('node:assert');
const { mrp, validar, nivelBajo, lote, MrpError } = require('../src/services/mrp.service');
 
const base = (o = {}) => ({ nombre: 'x', lead_time: 0, stock: 0, seguridad: 0, lote_min: 0, multiplo: 0, bom: [], recepciones: [], ...o });
 
// Caso 1: bici con inventario. Debe pedir 50 - 10 = 40 y lanzar en el periodo 3.
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
  assert.strictEqual(rueda.qty, 40); // 80 ruedas - 40 en stock
  assert.strictEqual(rueda.lanzar, 2);
});
 
// Caso 2: ítem compartido. El inventario se descuenta UNA sola vez con la demanda de ambos padres.
test('ítem compartido por dos padres', () => {
  const items = {
    A: base({ bom: [{ item: 'T', qty: 2 }] }),
    B: base({ bom: [{ item: 'T', qty: 3 }] }),
    T: base({ stock: 10 }),
  };
  const r = mrp(items, [{ item: 'A', periodo: 2, qty: 5 }, { item: 'B', periodo: 2, qty: 5 }], 4);
  const t = r.ordenes.find((o) => o.item === 'T');
  assert.strictEqual(t.qty, 15); // 10 + 15 = 25 necesarios, hay 10
});
 
// Caso 3: ciclo en el BOM
test('detecta ciclos en el BOM', () => {
  const items = { A: base({ bom: [{ item: 'B', qty: 1 }] }), B: base({ bom: [{ item: 'A', qty: 1 }] }) };
  assert.throws(() => validar(items), MrpError);
});
 
// Caso 4: recepción programada cubre la demanda
test('recepción programada evita crear orden', () => {
  const items = { A: base({ stock: 0, recepciones: [{ periodo: 1, qty: 20 }] }) };
  const r = mrp(items, [{ item: 'A', periodo: 2, qty: 20 }], 4);
  assert.strictEqual(r.ordenes.length, 0);
});
 
// Caso 5: lote mínimo y múltiplo
test('lote mínimo y múltiplo', () => {
  assert.strictEqual(lote(7, base({ lote_min: 10 })), 10);
  assert.strictEqual(lote(23, base({ multiplo: 10 })), 30);
});
 
// Caso 6: nivel bajo = nivel más profundo
test('nivel bajo del ítem compartido', () => {
  const items = {
    P: base({ bom: [{ item: 'S', qty: 1 }, { item: 'T', qty: 1 }] }),
    S: base({ bom: [{ item: 'T', qty: 1 }] }),
    T: base(),
  };
  assert.deepStrictEqual(nivelBajo(items), { P: 0, S: 1, T: 2 });
});
 
// Caso 7: orden atrasada si el lead time no alcanza
test('marca orden atrasada', () => {
  const items = { A: base({ lead_time: 3 }) };
  const r = mrp(items, [{ item: 'A', periodo: 1, qty: 5 }], 4);
  assert.strictEqual(r.ordenes[0].atrasada, true);
});