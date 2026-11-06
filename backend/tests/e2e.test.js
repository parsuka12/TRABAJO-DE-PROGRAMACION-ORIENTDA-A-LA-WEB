const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/config/db');

// Helper para limpiar la base de datos entre tests
async function limpiarBaseDatos() {
  await pool.query('DELETE FROM recepciones');
  await pool.query('DELETE FROM demandas');
  await pool.query('DELETE FROM bom');
  await pool.query('DELETE FROM articulos');
  // Reiniciar secuencias
  await pool.query("ALTER SEQUENCE articulos_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE bom_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE demandas_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE recepciones_id_seq RESTART WITH 1");
}

// Helper para crear artículo
async function crearArticulo(datos) {
  const res = await request(app)
    .post('/api/articulos')
    .send(datos);
  return res;
}

// Helper para crear BOM
async function crearBom(datos) {
  const res = await request(app)
    .post('/api/bom')
    .send(datos);
  return res;
}

// Helper para crear demanda
async function crearDemanda(datos) {
  const res = await request(app)
    .post('/api/demandas')
    .send(datos);
  return res;
}

// Helper para crear recepción
async function crearRecepcion(datos) {
  const res = await request(app)
    .post('/api/recepciones')
    .send(datos);
  return res;
}

// Helper para ejecutar MRP
async function ejecutarMrp(horizonte, item = null) {
  const body = { horizonte };
  if (item) body.item = item;
  const res = await request(app)
    .post('/api/mrp/run')
    .send(body);
  return res;
}

// Setup y teardown
test.before(async () => {
  // Verificar conexión a BD
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.warn('Base de datos no disponible, tests E2E se saltarán:', error.message);
    return;
  }
  await limpiarBaseDatos();
});

test.after(async () => {
  await pool.end();
});

test('E2E: Flujo completo - Artículos + BOM + Demandas + MRP', async () => {
  // Verificar que la BD está disponible
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  // ========== 1. CREAR ARTÍCULOS ==========

  // Crear BICI (producto final)
  const biciRes = await crearArticulo({
    codigo: 'BICI',
    nombre: 'Bicicleta',
    stock: 10,
    stock_seguridad: 0,
    tiempo_entrega: 1,
    lote_minimo: 0,
    multiplo: 1
  });
  assert.strictEqual(biciRes.status, 201);
  assert.ok(biciRes.body.articulo.id);
  const biciId = biciRes.body.articulo.id;

  // Crear RUEDA (componente)
  const ruedaRes = await crearArticulo({
    codigo: 'RUEDA',
    nombre: 'Rueda',
    stock: 40,
    stock_seguridad: 0,
    tiempo_entrega: 1,
    lote_minimo: 0,
    multiplo: 1
  });
  assert.strictEqual(ruedaRes.status, 201);
  const ruedaId = ruedaRes.body.articulo.id;

  // Crear CUADRO (componente)
  const cuadroRes = await crearArticulo({
    codigo: 'CUADRO',
    nombre: 'Cuadro',
    stock: 15,
    stock_seguridad: 0,
    tiempo_entrega: 2,
    lote_minimo: 0,
    multiplo: 1
  });
  assert.strictEqual(cuadroRes.status, 201);
  const cuadroId = cuadroRes.body.articulo.id;

  // Verificar listado de artículos
  const listRes = await request(app).get('/api/articulos');
  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listRes.body.length, 3);

  // ========== 2. CREAR BOM ==========

  // BICI necesita 2 RUEDA
  const bomRueda = await crearBom({
    articulo_id: biciId,
    componente_id: ruedaId,
    cantidad: 2
  });
  assert.strictEqual(bomRueda.status, 201);

  // BICI necesita 1 CUADRO
  const bomCuadro = await crearBom({
    articulo_id: biciId,
    componente_id: cuadroId,
    cantidad: 1
  });
  assert.strictEqual(bomCuadro.status, 201);

  // Verificar BOM de BICI
  const bomRes = await request(app).get(`/api/articulos/${biciId}/bom`);
  assert.strictEqual(bomRes.status, 200);
  assert.strictEqual(bomRes.body.length, 2);

  // Verificar árbol BOM
  const arbolRes = await request(app).get(`/api/articulos/${biciId}/bom/arbol`);
  assert.strictEqual(arbolRes.status, 200);
  assert.strictEqual(arbolRes.body.codigo, 'BICI');
  assert.strictEqual(arbolRes.body.hijos.length, 2);

  // ========== 3. CREAR DEMANDAS ==========

  // Demanda: 50 BICI en periodo 4
  const demandaRes = await crearDemanda({
    articulo_id: biciId,
    periodo: 4,
    cantidad: 50
  });
  assert.strictEqual(demandaRes.status, 201);

  // Verificar demandas
  const demandasRes = await request(app).get('/api/demandas');
  assert.strictEqual(demandasRes.status, 200);
  assert.strictEqual(demandasRes.body.length, 1);

  // ========== 4. EJECUTAR MRP ==========

  const mrpRes = await ejecutarMrp(8, 'BICI');
  assert.strictEqual(mrpRes.status, 200);

  const resultado = mrpRes.body;

  // Verificar estructura de respuesta
  assert.ok(resultado.horizonte === 8);
  assert.ok(Array.isArray(resultado.ordenes));
  assert.ok(resultado.items);
  assert.ok(resultado.kpis);
  assert.ok(resultado.demanda_utilizada);

  // Verificar KPIs
  assert.strictEqual(resultado.kpis.total_ordenes, 3); // BICI, RUEDA, CUADRO
  assert.strictEqual(resultado.kpis.ordenes_produccion, 1); // BICI
  assert.strictEqual(resultado.kpis.ordenes_compra, 2); // RUEDA, CUADRO

  // Verificar órdenes específicas
  const ordenBici = resultado.ordenes.find(o => o.item === 'BICI');
  const ordenRueda = resultado.ordenes.find(o => o.item === 'RUEDA');
  const ordenCuadro = resultado.ordenes.find(o => o.item === 'CUADRO');

  assert.ok(ordenBici);
  assert.ok(ordenRueda);
  assert.ok(ordenCuadro);

  // BICI: neto = 50 - 10 = 40, lanza en t=3 (periodo 4 - lead time 1)
  assert.strictEqual(ordenBici.qty, 40);
  assert.strictEqual(ordenBici.lanzar, 3);
  assert.strictEqual(ordenBici.recibir, 4);
  assert.strictEqual(ordenBici.tipo, 'Producción');

  // RUEDA: explosión 40 * 2 = 80, neto = 80 - 40 = 40, lanza en t=2 (periodo 3 - lead time 1)
  assert.strictEqual(ordenRueda.qty, 40);
  assert.strictEqual(ordenRueda.lanzar, 2);
  assert.strictEqual(ordenRueda.recibir, 3);
  assert.strictEqual(ordenRueda.tipo, 'Compra');

  // CUADRO: explosión 40 * 1 = 40, neto = 40 - 15 = 25, lanza en t=1 (periodo 3 - lead time 2)
  assert.strictEqual(ordenCuadro.qty, 25);
  assert.strictEqual(ordenCuadro.lanzar, 1);
  assert.strictEqual(ordenCuadro.recibir, 3);
  assert.strictEqual(ordenCuadro.tipo, 'Compra');

  // Verificar demanda utilizada
  assert.strictEqual(resultado.demanda_utilizada.length, 1);
  assert.strictEqual(resultado.demanda_utilizada[0].item, 'BICI');
  assert.strictEqual(resultado.demanda_utilizada[0].periodo, 4);
  assert.strictEqual(resultado.demanda_utilizada[0].qty, 50);
});

test('E2E: MRP con recepciones programadas', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  // Crear artículos
  const biciRes = await crearArticulo({
    codigo: 'BICI',
    nombre: 'Bicicleta',
    stock: 10,
    tiempo_entrega: 1
  });
  const biciId = biciRes.body.articulo.id;

  const ruedaRes = await crearArticulo({
    codigo: 'RUEDA',
    nombre: 'Rueda',
    stock: 40,
    tiempo_entrega: 1
  });
  const ruedaId = ruedaRes.body.articulo.id;

  // BOM
  await crearBom({ articulo_id: biciId, componente_id: ruedaId, cantidad: 2 });

  // Demanda
  await crearDemanda({ articulo_id: biciId, periodo: 4, cantidad: 50 });

  // Recepción: 20 RUEDA en periodo 2
  const recepcionRes = await crearRecepcion({
    articulo_id: ruedaId,
    periodo: 2,
    cantidad: 20
  });
  assert.strictEqual(recepcionRes.status, 201);

  // Ejecutar MRP
  const mrpRes = await ejecutarMrp(8, 'BICI');
  assert.strictEqual(mrpRes.status, 200);

  const ordenRueda = mrpRes.body.ordenes.find(o => o.item === 'RUEDA');

  // Con 20 ruedas llegando en periodo 2:
  // RUEDA necesita 80 (explosión), tiene 40 stock + 20 recepción = 60, neto = 20
  assert.strictEqual(ordenRueda.qty, 20);
});

test('E2E: MRP con lote mínimo y múltiplo', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  // Artículo con lote mínimo 50 y múltiplo 25
  const artRes = await crearArticulo({
    codigo: 'TORNILLO',
    nombre: 'Tornillo',
    stock: 0,
    tiempo_entrega: 1,
    lote_minimo: 50,
    multiplo: 25
  });
  const artId = artRes.body.articulo.id;

  // Demanda: 30 unidades en periodo 2
  await crearDemanda({ articulo_id: artId, periodo: 2, cantidad: 30 });

  const mrpRes = await ejecutarMrp(5, 'TORNILLO');
  assert.strictEqual(mrpRes.status, 200);

  const orden = mrpRes.body.ordenes[0];

  // Necesita 30, lote_min=50 => 50, múltiplo 25 => 50 (ya es múltiplo)
  assert.strictEqual(orden.qty, 50);
});

test('E2E: MRP con stock de seguridad', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  // Artículo con stock_seguridad = 10
  const artRes = await crearArticulo({
    codigo: 'MADERA',
    nombre: 'Madera',
    stock: 5,
    stock_seguridad: 10,
    tiempo_entrega: 1
  });
  const artId = artRes.body.articulo.id;

  // Demanda: 5 unidades en periodo 1 (stock 5, pero seguridad 10)
  await crearDemanda({ articulo_id: artId, periodo: 1, cantidad: 5 });

  const mrpRes = await ejecutarMrp(3, 'MADERA');
  assert.strictEqual(mrpRes.status, 200);

  const orden = mrpRes.body.ordenes[0];

  // Tiene 5, demanda 5 => disponible 0 < seguridad 10 => neto = 10
  assert.strictEqual(orden.qty, 10);
});

test('E2E: MRP sin filtrar artículo (usa todas las demandas)', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  // Crear dos productos independientes
  const aRes = await crearArticulo({ codigo: 'PROD_A', nombre: 'Producto A', stock: 10, tiempo_entrega: 1 });
  const bRes = await crearArticulo({ codigo: 'PROD_B', nombre: 'Producto B', stock: 20, tiempo_entrega: 1 });

  const aId = aRes.body.articulo.id;
  const bId = bRes.body.articulo.id;

  // Demandas para ambos
  await crearDemanda({ articulo_id: aId, periodo: 2, cantidad: 30 });
  await crearDemanda({ articulo_id: bId, periodo: 3, cantidad: 40 });

  // Ejecutar MRP SIN filtro de artículo
  const mrpRes = await ejecutarMrp(5);
  assert.strictEqual(mrpRes.status, 200);

  // Debe generar órdenes para ambos
  assert.strictEqual(mrpRes.body.demanda_utilizada.length, 2);
  assert.strictEqual(mrpRes.body.kpis.total_ordenes, 2);
});

test('E2E: Validaciones - Ciclo en BOM rechazado', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  const aRes = await crearArticulo({ codigo: 'A', nombre: 'A', stock: 10 });
  const bRes = await crearArticulo({ codigo: 'B', nombre: 'B', stock: 10 });

  const aId = aRes.body.articulo.id;
  const bId = bRes.body.articulo.id;

  // A -> B
  await crearBom({ articulo_id: aId, componente_id: bId, cantidad: 1 });

  // Intentar B -> A (crearía ciclo)
  const cicloRes = await crearBom({ articulo_id: bId, componente_id: aId, cantidad: 1 });

  assert.strictEqual(cicloRes.status, 409);
  assert.ok(cicloRes.body.mensaje.includes('ciclo'));
});

test('E2E: Validaciones - Artículo con BOM no se puede eliminar', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  const aRes = await crearArticulo({ codigo: 'PADRE', nombre: 'Padre', stock: 10 });
  const bRes = await crearArticulo({ codigo: 'HIJO', nombre: 'Hijo', stock: 10 });

  const aId = aRes.body.articulo.id;
  const bId = bRes.body.articulo.id;

  await crearBom({ articulo_id: aId, componente_id: bId, cantidad: 1 });

  // Intentar eliminar PADRE (tiene BOM como padre)
  const delRes = await request(app).delete(`/api/articulos/${aId}`);
  assert.strictEqual(delRes.status, 409);
  assert.ok(delRes.body.mensaje.includes('BOM'));

  // Intentar eliminar HIJO (tiene BOM como componente)
  const delRes2 = await request(app).delete(`/api/articulos/${bId}`);
  assert.strictEqual(delRes2.status, 409);
  assert.ok(delRes2.body.mensaje.includes('BOM'));
});

test('E2E: Validaciones - Artículo con demandas no se puede eliminar', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  const aRes = await crearArticulo({ codigo: 'CON_DEMANDA', nombre: 'Con Demanda', stock: 10 });
  const aId = aRes.body.articulo.id;

  await crearDemanda({ articulo_id: aId, periodo: 1, cantidad: 5 });

  const delRes = await request(app).delete(`/api/articulos/${aId}`);
  assert.strictEqual(delRes.status, 409);
  assert.ok(delRes.body.mensaje.includes('demandas'));
});

test('E2E: CRUD completo Demandas y Recepciones', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  const aRes = await crearArticulo({ codigo: 'TEST', nombre: 'Test', stock: 10 });
  const aId = aRes.body.articulo.id;

  // Crear demanda
  const d1 = await crearDemanda({ articulo_id: aId, periodo: 1, cantidad: 10 });
  assert.strictEqual(d1.status, 201);
  const demandaId = d1.body.demanda.id;

  // Leer demanda
  const getD = await request(app).get(`/api/demandas/${demandaId}`);
  assert.strictEqual(getD.status, 200);
  assert.strictEqual(getD.body.cantidad, 10);

  // Actualizar demanda
  const updD = await request(app).put(`/api/demandas/${demandaId}`).send({ cantidad: 20 });
  assert.strictEqual(updD.status, 200);
  assert.strictEqual(updD.body.demanda.cantidad, 20);

  // Crear recepción
  const r1 = await crearRecepcion({ articulo_id: aId, periodo: 2, cantidad: 15 });
  assert.strictEqual(r1.status, 201);
  const recepcionId = r1.body.recepcion.id;

  // Leer recepción
  const getR = await request(app).get(`/api/recepciones/${recepcionId}`);
  assert.strictEqual(getR.status, 200);
  assert.strictEqual(getR.body.cantidad, 15);

  // Actualizar recepción
  const updR = await request(app).put(`/api/recepciones/${recepcionId}`).send({ periodo: 3 });
  assert.strictEqual(updR.status, 200);
  assert.strictEqual(updR.body.recepcion.periodo, 3);

  // Listar por artículo
  const byArtD = await request(app).get(`/api/articulos/${aId}/demandas`);
  assert.strictEqual(byArtD.status, 200);
  assert.strictEqual(byArtD.body.length, 1);

  const byArtR = await request(app).get(`/api/articulos/${aId}/recepciones`);
  assert.strictEqual(byArtR.status, 200);
  assert.strictEqual(byArtR.body.length, 1);

  // Eliminar
  const delD = await request(app).delete(`/api/demandas/${demandaId}`);
  assert.strictEqual(delD.status, 200);

  const delR = await request(app).delete(`/api/recepciones/${recepcionId}`);
  assert.strictEqual(delR.status, 200);
});

test('E2E: MRP con artículo que no tiene demandas', async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    console.log('BD no disponible, saltando test E2E');
    return;
  }

  await limpiarBaseDatos();

  const aRes = await crearArticulo({ codigo: 'SIN_DEMANDA', nombre: 'Sin Demanda', stock: 10 });
  const aId = aRes.body.articulo.id;

  // Ejecutar MRP filtrando artículo sin demandas
  const mrpRes = await ejecutarMrp(5, 'SIN_DEMANDA');

  assert.strictEqual(mrpRes.status, 404);
  assert.ok(mrpRes.body.mensaje.includes('No hay demandas'));
});