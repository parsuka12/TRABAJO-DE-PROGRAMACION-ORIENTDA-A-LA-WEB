const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/index');

test('POST /api/mrp/run - Falla si el item no existe en la BD', async () => {
  const res = await request(app)
    .post('/api/mrp/run')
    .send({ horizonte: 10, item: 'NO_EXISTE', periodo: 1, qty: 5 });
  
  assert.ok(res.status === 404 || res.status === 500);
  assert.ok(res.body.mensaje);
});