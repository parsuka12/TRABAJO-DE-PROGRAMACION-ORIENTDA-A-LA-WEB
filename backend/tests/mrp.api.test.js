const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.JWT_SECRET = 'secreto-solamente-para-pruebas';

const jwt = require('jsonwebtoken');
const app = require('../src/index');

const token = jwt.sign(
  { sub: 1, role: 'planificador' },
  process.env.JWT_SECRET
);

test('POST /api/mrp/run - Falla si el item no existe en la BD', async () => {
  const res = await request(app)
    .post('/api/mrp/run')
    .set('Authorization', `Bearer ${token}`)
    .send({ horizonte: 10, item: 'NO_EXISTE' });

  assert.ok(res.status === 404 || res.status === 500);
  assert.ok(res.body.mensaje);
});
test('Rechaza solicitudes sin token', async () => {
  const res = await request(app)
    .post('/api/mrp/run')
    .send({ horizonte: 10 });

  assert.equal(res.status, 401);
});

test('Rechaza usuarios sin rol planificador', async () => {
  const tokenSinPermiso = jwt.sign(
    { sub: 1, role: 'consulta' },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .post('/api/mrp/run')
    .set('Authorization', `Bearer ${tokenSinPermiso}`)
    .send({ horizonte: 10 });

  assert.equal(res.status, 403);
});