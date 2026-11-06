const test = require('node:test');
const assert = require('node:assert');
const { z } = require('zod');
const { validarCrearBom, validarActualizarBom, validarIdParam, validarBomIdParam } = require('../src/validations/bom.validation');

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

test('validarCrearBom - datos válidos', () => {
  const datos = { articulo_id: 1, componente_id: 2, cantidad: 2 };
  const resultado = validarCrearBom(datos);
  assert.deepStrictEqual(resultado, datos);
});

test('validarCrearBom - rechaza mismo ID (ciclo directo)', () => {
  assertValidationError(
    () => validarCrearBom({ articulo_id: 1, componente_id: 1, cantidad: 1 }),
    'Un artículo no puede ser componente de sí mismo'
  );
});

test('validarCrearBom - rechaza cantidad <= 0', () => {
  assertValidationError(
    () => validarCrearBom({ articulo_id: 1, componente_id: 2, cantidad: 0 }),
    'La cantidad debe ser mayor a 0'
  );
  assertValidationError(
    () => validarCrearBom({ articulo_id: 1, componente_id: 2, cantidad: -1 }),
    'La cantidad debe ser mayor a 0'
  );
});

test('validarCrearBom - rechaza IDs no enteros positivos', () => {
  // Zod v4 da mensajes diferentes: 0 y -1 usan nuestro mensaje custom, 1.5 usa el default
  assertValidationError(
    () => validarCrearBom({ articulo_id: 0, componente_id: 2, cantidad: 1 }),
    'El ID del artículo padre debe ser un entero positivo'
  );
  assertValidationError(
    () => validarCrearBom({ articulo_id: 1.5, componente_id: 2, cantidad: 1 }),
    'expected int, received number'
  );
  assertValidationError(
    () => validarCrearBom({ articulo_id: -1, componente_id: 2, cantidad: 1 }),
    'El ID del artículo padre debe ser un entero positivo'
  );
});

test('validarActualizarBom - cantidad válida', () => {
  const resultado = validarActualizarBom({ cantidad: 5 });
  assert.strictEqual(resultado.cantidad, 5);
});

test('validarActualizarBom - rechaza cantidad inválida', () => {
  assertValidationError(
    () => validarActualizarBom({ cantidad: 0 }),
    'La cantidad debe ser mayor a 0'
  );
  assertValidationError(
    () => validarActualizarBom({ cantidad: -1 }),
    'La cantidad debe ser mayor a 0'
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

test('validarBomIdParam - IDs válidos', () => {
  const resultado = validarBomIdParam({ id: '3', articuloId: '1' });
  assert.strictEqual(resultado.id, 3);
  assert.strictEqual(resultado.articuloId, 1);
});

test('validarBomIdParam - rechaza IDs inválidos', () => {
  assertValidationError(
    () => validarBomIdParam({ id: '0', articuloId: '1' }),
    'El ID del BOM debe ser un número entero positivo'
  );
  assertValidationError(
    () => validarBomIdParam({ id: '1', articuloId: '0' }),
    'El ID del artículo debe ser un número entero positivo'
  );
});