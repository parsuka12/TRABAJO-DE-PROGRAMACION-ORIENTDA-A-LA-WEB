const test = require('node:test');
const assert = require('node:assert');
const { z } = require('zod');
const {
  validarCrearDemanda,
  validarActualizarDemanda,
  validarCrearRecepcion,
  validarActualizarRecepcion,
  validarIdParam,
  validarArticuloIdParam,
} = require('../src/validations/demandas.validation');

function assertValidationError(fn, expectedMessage) {
  let thrown = false;
  let errorMessage = '';
  try {
    fn();
  } catch (e) {
    thrown = true;
    if (e instanceof z.ZodError) {
      errorMessage = e.issues.map(err => err.message).join(', ');
    } else if (e instanceof Error) {
      errorMessage = e.message;
    } else {
      errorMessage = String(e);
    }
    assert.ok(errorMessage.includes(expectedMessage), `Esperaba mensaje "${expectedMessage}", obtuve: ${errorMessage}`);
  }
  assert.ok(thrown, `Se esperaba error con mensaje "${expectedMessage}"`);
}

test('validarCrearDemanda - datos válidos', () => {
  const datos = { articulo_id: 1, periodo: 4, cantidad: 50 };
  const resultado = validarCrearDemanda(datos);
  assert.deepStrictEqual(resultado, datos);
});

test('validarCrearDemanda - rechaza periodo negativo', () => {
  assertValidationError(
    () => validarCrearDemanda({ articulo_id: 1, periodo: -1, cantidad: 50 }),
    'El periodo debe ser mayor o igual a 0'
  );
});

test('validarCrearDemanda - rechaza cantidad <= 0', () => {
  assertValidationError(
    () => validarCrearDemanda({ articulo_id: 1, periodo: 4, cantidad: 0 }),
    'La cantidad debe ser mayor a 0'
  );
  assertValidationError(
    () => validarCrearDemanda({ articulo_id: 1, periodo: 4, cantidad: -5 }),
    'La cantidad debe ser mayor a 0'
  );
});

test('validarCrearDemanda - rechaza articulo_id inválido', () => {
  assertValidationError(
    () => validarCrearDemanda({ articulo_id: 0, periodo: 4, cantidad: 50 }),
    'El ID del artículo debe ser un entero positivo'
  );
  assertValidationError(
    () => validarCrearDemanda({ articulo_id: 1.5, periodo: 4, cantidad: 50 }),
    'expected int, received number'
  );
});

test('validarActualizarDemanda - campos válidos', () => {
  const resultado = validarActualizarDemanda({ cantidad: 60 });
  assert.strictEqual(resultado.cantidad, 60);
});

test('validarActualizarDemanda - rechaza vacío', () => {
  assertValidationError(
    () => validarActualizarDemanda({}),
    'Debe proporcionar al menos un campo para actualizar'
  );
});

test('validarActualizarDemanda - rechaza cantidad inválida', () => {
  assertValidationError(
    () => validarActualizarDemanda({ cantidad: 0 }),
    'La cantidad debe ser mayor a 0'
  );
});

test('validarCrearRecepcion - datos válidos', () => {
  const datos = { articulo_id: 2, periodo: 2, cantidad: 20 };
  const resultado = validarCrearRecepcion(datos);
  assert.deepStrictEqual(resultado, datos);
});

test('validarCrearRecepcion - rechaza periodo negativo', () => {
  assertValidationError(
    () => validarCrearRecepcion({ articulo_id: 2, periodo: -1, cantidad: 20 }),
    'El periodo debe ser mayor o igual a 0'
  );
});

test('validarCrearRecepcion - rechaza cantidad <= 0', () => {
  assertValidationError(
    () => validarCrearRecepcion({ articulo_id: 2, periodo: 2, cantidad: 0 }),
    'La cantidad debe ser mayor a 0'
  );
});

test('validarActualizarRecepcion - campos válidos', () => {
  const resultado = validarActualizarRecepcion({ periodo: 3, cantidad: 25 });
  assert.strictEqual(resultado.periodo, 3);
  assert.strictEqual(resultado.cantidad, 25);
});

test('validarActualizarRecepcion - rechaza vacío', () => {
  assertValidationError(
    () => validarActualizarRecepcion({}),
    'Debe proporcionar al menos un campo para actualizar'
  );
});

test('validarIdParam - ID válido', () => {
  const resultado = validarIdParam({ id: '5' });
  assert.strictEqual(resultado.id, 5);
});

test('validarIdParam - rechaza ID inválido', () => {
  assertValidationError(
    () => validarIdParam({ id: '0' }),
    'El ID debe ser un número entero positivo'
  );
  assertValidationError(
    () => validarIdParam({ id: '-1' }),
    'El ID debe ser un número entero positivo'
  );
  assertValidationError(
    () => validarIdParam({ id: 'abc' }),
    'El ID debe ser un número entero positivo'
  );
});

test('validarArticuloIdParam - ID válido', () => {
  const resultado = validarArticuloIdParam({ articuloId: '3' });
  assert.strictEqual(resultado.articuloId, 3);
});

test('validarArticuloIdParam - rechaza ID inválido', () => {
  assertValidationError(
    () => validarArticuloIdParam({ articuloId: '0' }),
    'El ID del artículo debe ser un número entero positivo'
  );
  assertValidationError(
    () => validarArticuloIdParam({ articuloId: 'abc' }),
    'El ID del artículo debe ser un número entero positivo'
  );
});