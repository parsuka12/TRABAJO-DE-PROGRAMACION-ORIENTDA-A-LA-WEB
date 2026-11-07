const test = require('node:test');
const assert = require('node:assert');
const pool = require('../src/config/db');
const corridasRepository = require('../src/repositories/corridas.repository');

// Helper para limpiar la tabla de corridas entre tests
async function limpiarCorridas() {
  await pool.query('DELETE FROM corridas');
  await pool.query("ALTER SEQUENCE corridas_id_seq RESTART WITH 1");
}

// Datos de ejemplo para una corrida
const resultadoEjemplo = {
  horizonte: 5,
  orden_proceso: ['RUEDA', 'CUADRO', 'BICI'],
  ordenes: [
    { item: 'RUEDA', nombre: 'Rueda', nivel: 1, qty: 100, lanzar: 2, recibir: 3, atrasada: false, tipo: 'Producción' },
    { item: 'CUADRO', nombre: 'Cuadro', nivel: 1, qty: 50, lanzar: 1, recibir: 3, atrasada: false, tipo: 'Producción' },
    { item: 'BICI', nombre: 'Bicicleta', nivel: 0, qty: 50, lanzar: 3, recibir: 4, atrasada: false, tipo: 'Producción' },
  ],
  kpis: {
    total_ordenes: 3,
    ordenes_compra: 0,
    ordenes_produccion: 3,
    ordenes_atrasadas: 0,
  },
  demanda_utilizada: [
    { item: 'BICI', periodo: 4, qty: 50 },
  ],
};

// Setup y teardown
test.before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.warn('Base de datos no disponible, tests de corridas se saltarán:', error.message);
    return;
  }
  await limpiarCorridas();
});

test.after(async () => {
  try {
    await limpiarCorridas();
  } catch {
    // BD no disponible, ignorar limpieza
  }
  // No cerrar el pool aquí: se comparte entre todos los archivos de test
});

test('Corridas: guardar una corrida en la base de datos', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test de guardar corrida');
    return;
  }

  await limpiarCorridas();

  const corrida = await corridasRepository.guardar(5, 1, resultadoEjemplo);

  assert.ok(corrida.id, 'la corrida debe tener un id generado');
  assert.strictEqual(corrida.horizonte, 5);
  assert.strictEqual(corrida.usuario_id, 1);
  assert.ok(corrida.fecha, 'la corrida debe tener una fecha');
  assert.deepStrictEqual(corrida.resultado, resultadoEjemplo);
});

test('Corridas: listar corridas devuelve las corridas guardadas', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test de listar corridas');
    return;
  }

  await limpiarCorridas();

  // Crear dos corridas
  await corridasRepository.guardar(5, 1, resultadoEjemplo);
  await corridasRepository.guardar(10, 2, { ...resultadoEjemplo, horizonte: 10 });

  const corridas = await corridasRepository.listar();

  assert.strictEqual(corridas.length, 2, 'deberían haber 2 corridas');
  // Ordenadas por fecha descendente, la más reciente primero
  assert.ok(corridas[0].id);
  assert.ok(corridas[1].id);
});

test('Corridas: listar devolviendo arreglo vacío cuando no hay corridas', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test de listar corridas vacío');
    return;
  }

  await limpiarCorridas();

  const corridas = await corridasRepository.listar();

  assert.strictEqual(corridas.length, 0);
});

test('Corridas: guardar sin usuario_id (opcional)', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test de guardar corrida sin usuario');
    return;
  }

  await limpiarCorridas();

  const corrida = await corridasRepository.guardar(8, null, resultadoEjemplo);

  assert.ok(corrida.id);
  assert.strictEqual(corrida.horizonte, 8);
  assert.strictEqual(corrida.usuario_id, null);
});