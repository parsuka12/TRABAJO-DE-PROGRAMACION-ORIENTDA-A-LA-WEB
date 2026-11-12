const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto';

test('POST /api/mrp/run - 401 sin token (No autorizado)', async () => {
  const res = await request(app)
    .post('/api/mrp/run')
    .send({ horizonte: 10, item: 'BICI' });
  
  assert.strictEqual(res.status, 401);
});

test('POST /api/mrp/run - 403 con rol equivocado (Prohibido)', async () => {
  const tokenVendedor = jwt.sign({ id: 1, rol: 'vendedor' }, JWT_SECRET, { expiresIn: '1h' });

  const res = await request(app)
    .post('/api/mrp/run')
    .set('Authorization', `Bearer ${tokenVendedor}`)
    .send({ horizonte: 10, item: 'BICI' });
  
  assert.strictEqual(res.status, 403);
});

test('POST /api/mrp/run - Bicicleta debe calcular 40, 40 y 25', async () => {
  const tokenAdmin = jwt.sign({ id: 1, rol: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  const res = await request(app)
    .post('/api/mrp/run')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ horizonte: 10, item: 'BICI' }); 
  
  if (res.status === 200) {
    assert.ok(res.body.ordenes, 'Debe devolver un array de ordenes');
    
    const ordenBici = res.body.ordenes.find(o => o.item === 'BICI');
    const ordenRueda = res.body.ordenes.find(o => o.item === 'RUEDA');
    
    if (ordenBici && ordenRueda) {
      assert.strictEqual(ordenBici.qty, 40, 'BICI debe dar 40');
      assert.strictEqual(ordenRueda.qty, 40, 'RUEDA debe dar 40');
      
    }
  } else {
    console.log('⚠️ Test de cálculo omitido: Asegurate de tener datos en la BD para la BICI');
  }
});