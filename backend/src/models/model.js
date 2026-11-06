
const pool = require('../config/db');
const { obtenerDatosMrp } = require('./mrp.model');

// Convertir campos NUMERIC de PostgreSQL (vienen como string) a Number
function convertirNumericos(fila, campos) {
  const resultado = { ...fila };
  for (const campo of campos) {
    if (resultado[campo] !== null && resultado[campo] !== undefined) {
      resultado[campo] = Number(resultado[campo]);
    }
  }
  return resultado;
}

function convertirArrayNumericos(filas, campos) {
  return filas.map((f) => convertirNumericos(f, campos));
}

// Consultar todos los articulos
async function obtenerArticulos() {
  const resultado = await pool.query(
    'SELECT * FROM articulos ORDER BY nombre'
  );
  const camposNumericos = ['stock', 'stock_seguridad', 'tiempo_entrega', 'lote_minimo', 'multiplo'];
  return convertirArrayNumericos(resultado.rows, camposNumericos);
}

// Consultar un articulo por su id
async function obtenerArticuloPorId(id) {
  const resultado = await pool.query(
    'SELECT * FROM articulos WHERE id = $1',
    [id]
  );
  const camposNumericos = ['stock', 'stock_seguridad', 'tiempo_entrega', 'lote_minimo', 'multiplo'];
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], camposNumericos) : null;
}

// Consultar un articulo por su codigo
async function obtenerArticuloPorCodigo(codigo) {
  const resultado = await pool.query(
    'SELECT * FROM articulos WHERE codigo = $1',
    [codigo]
  );
  const camposNumericos = ['stock', 'stock_seguridad', 'tiempo_entrega', 'lote_minimo', 'multiplo'];
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], camposNumericos) : null;
}

// Crear un nuevo articulo
async function crearArticulo({ codigo, nombre, stock = 0, stock_seguridad = 0, tiempo_entrega = 0, lote_minimo = 0, multiplo = 1 }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Verificar si ya existe el código
    const existe = await cliente.query('SELECT 1 FROM articulos WHERE codigo = $1', [codigo]);
    if (existe.rows.length > 0) {
      throw new Error(`Ya existe un artículo con el código '${codigo}'`);
    }

    const resultado = await cliente.query(
      `INSERT INTO articulos (codigo, nombre, stock, stock_seguridad, tiempo_entrega, lote_minimo, multiplo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [codigo, nombre, stock, stock_seguridad, tiempo_entrega, lote_minimo, multiplo]
    );

    await cliente.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Actualizar un articulo (campos parciales)
async function actualizarArticulo(id, datos) {
  const campos = [];
  const valores = [];
  let idx = 1;

  const camposPermitidos = ['codigo', 'nombre', 'stock', 'stock_seguridad', 'tiempo_entrega', 'lote_minimo', 'multiplo'];

  for (const [key, value] of Object.entries(datos)) {
    if (camposPermitidos.includes(key)) {
      campos.push(`${key} = $${idx}`);
      valores.push(value);
      idx++;
    }
  }

  if (campos.length === 0) {
    return null;
  }

  // Si se actualiza el código, verificar que no exista otro con el mismo código
  if (datos.codigo) {
    const existe = await pool.query('SELECT 1 FROM articulos WHERE codigo = $1 AND id <> $2', [datos.codigo, id]);
    if (existe.rows.length > 0) {
      throw new Error(`Ya existe un artículo con el código '${datos.codigo}'`);
    }
  }

  valores.push(id);
  const resultado = await pool.query(
    `UPDATE articulos SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
    valores
  );

  return resultado.rows[0] || null;
}

// Eliminar un articulo
async function eliminarArticulo(id) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Verificar si tiene BOM asociado (como padre o componente)
    const bomPadre = await cliente.query('SELECT 1 FROM bom WHERE articulo_id = $1', [id]);
    const bomHijo = await cliente.query('SELECT 1 FROM bom WHERE componente_id = $1', [id]);
    if (bomPadre.rows.length > 0 || bomHijo.rows.length > 0) {
      throw new Error('No se puede eliminar: el artículo tiene relaciones BOM asociadas');
    }

    // Verificar si tiene demandas
    const demandas = await cliente.query('SELECT 1 FROM demandas WHERE articulo_id = $1', [id]);
    if (demandas.rows.length > 0) {
      throw new Error('No se puede eliminar: el artículo tiene demandas asociadas');
    }

    // Verificar si tiene recepciones
    const recepciones = await cliente.query('SELECT 1 FROM recepciones WHERE articulo_id = $1', [id]);
    if (recepciones.rows.length > 0) {
      throw new Error('No se puede eliminar: el artículo tiene recepciones asociadas');
    }

    const resultado = await cliente.query('DELETE FROM articulos WHERE id = $1 RETURNING *', [id]);

    await cliente.query('COMMIT');
    return resultado.rows[0] || null;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Cambiar el stock de un articulo
async function cambiarStock(id, stock) {
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error('El stock no puede ser negativo');
  }

  const resultado = await pool.query(
    'UPDATE articulos SET stock = $1 WHERE id = $2 RETURNING *',
    [stock, id]
  );

  return resultado.rows[0] || null;
}

// ==================== BOM (Bill of Materials) ====================

// Validar que no se cree un ciclo en el BOM usando DFS
async function validarSinCiclos(articuloId, componenteId, cliente = pool) {
  // Si el componente es el mismo artículo, es un ciclo directo
  if (articuloId === componenteId) {
    throw new Error('Un artículo no puede ser componente de sí mismo');
  }

  // Verificar si el componente ya es ancestro del artículo (crearía ciclo)
  // Buscar hacia arriba: desde el componente, ¿podemos llegar al artículo padre?
  const visitados = new Set();
  const pila = [componenteId];

  while (pila.length > 0) {
    const actual = pila.pop();
    if (actual === articuloId) {
      throw new Error('La relación crearía un ciclo en el BOM');
    }
    if (visitados.has(actual)) continue;
    visitados.add(actual);

    // Buscar padres del componente actual
    const padres = await cliente.query(
      'SELECT articulo_id FROM bom WHERE componente_id = $1',
      [actual]
    );
    for (const fila of padres.rows) {
      pila.push(fila.articulo_id);
    }
  }
}

// Obtener todo el BOM de un artículo (sus componentes directos)
async function obtenerBomDeArticulo(articuloId) {
  const resultado = await pool.query(
    `SELECT b.id, b.articulo_id, b.componente_id, b.cantidad,
            a.codigo as articulo_codigo, a.nombre as articulo_nombre,
            c.codigo as componente_codigo, c.nombre as componente_nombre
     FROM bom b
     JOIN articulos a ON a.id = b.articulo_id
     JOIN articulos c ON c.id = b.componente_id
     WHERE b.articulo_id = $1
     ORDER BY c.codigo`,
    [articuloId]
  );
  return convertirArrayNumericos(resultado.rows, ['cantidad']);
}

// Obtener donde se usa un artículo como componente (padres)
async function obtenerDondeSeUsa(componenteId) {
  const resultado = await pool.query(
    `SELECT b.id, b.articulo_id, b.componente_id, b.cantidad,
            a.codigo as articulo_codigo, a.nombre as articulo_nombre,
            c.codigo as componente_codigo, c.nombre as componente_nombre
     FROM bom b
     JOIN articulos a ON a.id = b.articulo_id
     JOIN articulos c ON c.id = b.componente_id
     WHERE b.componente_id = $1
     ORDER BY a.codigo`,
    [componenteId]
  );
  return convertirArrayNumericos(resultado.rows, ['cantidad']);
}

// Obtener una relación BOM específica por ID
async function obtenerBomPorId(id) {
  const resultado = await pool.query(
    `SELECT b.id, b.articulo_id, b.componente_id, b.cantidad,
            a.codigo as articulo_codigo, a.nombre as articulo_nombre,
            c.codigo as componente_codigo, c.nombre as componente_nombre
     FROM bom b
     JOIN articulos a ON a.id = b.articulo_id
     JOIN articulos c ON c.id = b.componente_id
     WHERE b.id = $1`,
    [id]
  );
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], ['cantidad']) : null;
}

// Crear una relación BOM
async function crearBom({ articulo_id, componente_id, cantidad }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Verificar que ambos artículos existan
    const [articulo, componente] = await Promise.all([
      cliente.query('SELECT 1 FROM articulos WHERE id = $1', [articulo_id]),
      cliente.query('SELECT 1 FROM articulos WHERE id = $1', [componente_id]),
    ]);

    if (articulo.rows.length === 0) {
      throw new Error(`No existe el artículo padre con ID ${articulo_id}`);
    }
    if (componente.rows.length === 0) {
      throw new Error(`No existe el componente con ID ${componente_id}`);
    }

    // Validar que no cree ciclos
    await validarSinCiclos(articulo_id, componente_id, cliente);

    // Verificar que no exista ya la relación
    const existe = await cliente.query(
      'SELECT 1 FROM bom WHERE articulo_id = $1 AND componente_id = $2',
      [articulo_id, componente_id]
    );
    if (existe.rows.length > 0) {
      throw new Error('Ya existe una relación BOM entre estos artículos');
    }

    const resultado = await cliente.query(
      `INSERT INTO bom (articulo_id, componente_id, cantidad)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [articulo_id, componente_id, cantidad]
    );

    await cliente.query('COMMIT');
    return await obtenerBomPorId(resultado.rows[0].id);
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Actualizar cantidad de una relación BOM
async function actualizarBom(id, cantidad) {
  const resultado = await pool.query(
    'UPDATE bom SET cantidad = $1 WHERE id = $2 RETURNING *',
    [cantidad, id]
  );

  if (resultado.rows.length === 0) {
    return null;
  }

  return await obtenerBomPorId(id);
}

// Eliminar una relación BOM
async function eliminarBom(id) {
  const resultado = await pool.query(
    'DELETE FROM bom WHERE id = $1 RETURNING *',
    [id]
  );

  return resultado.rows[0] || null;
}

// Obtener BOM completo expandido (árbol) para un artículo
async function obtenerArbolBom(articuloId, nivel = 0, visitados = new Set()) {
  if (visitados.has(articuloId)) {
    return { error: 'Ciclo detectado' };
  }
  visitados.add(articuloId);

  const articulo = await pool.query('SELECT id, codigo, nombre FROM articulos WHERE id = $1', [articuloId]);
  if (articulo.rows.length === 0) return null;

  const componentes = await obtenerBomDeArticulo(articuloId);

  const hijos = [];
  for (const comp of componentes) {
    const subArbol = await obtenerArbolBom(comp.componente_id, nivel + 1, new Set(visitados));
    if (subArbol) {
      hijos.push({
        ...subArbol,
        cantidad: comp.cantidad,
        cantidad_total: comp.cantidad // Se calculará en el servicio MRP
      });
    }
  }

  return {
    id: articulo.rows[0].id,
    codigo: articulo.rows[0].codigo,
    nombre: articulo.rows[0].nombre,
    nivel,
    hijos,
  };
}

// ==================== DEMANDAS ====================

async function obtenerDemandas(filtros = {}) {
  let query = `
    SELECT d.id, d.articulo_id, d.periodo, d.cantidad,
           a.codigo as articulo_codigo, a.nombre as articulo_nombre
    FROM demandas d
    JOIN articulos a ON a.id = d.articulo_id
  `;
  const params = [];
  const condiciones = [];

  if (filtros.articuloId) {
    params.push(filtros.articuloId);
    condiciones.push(`d.articulo_id = $${params.length}`);
  }
  if (filtros.periodo !== undefined) {
    params.push(filtros.periodo);
    condiciones.push(`d.periodo = $${params.length}`);
  }

  if (condiciones.length > 0) {
    query += ' WHERE ' + condiciones.join(' AND ');
  }

  query += ' ORDER BY d.periodo, a.codigo';

  const resultado = await pool.query(query, params);
  return convertirArrayNumericos(resultado.rows, ['cantidad', 'periodo']);
}

async function obtenerDemandaPorId(id) {
  const resultado = await pool.query(
    `SELECT d.id, d.articulo_id, d.periodo, d.cantidad,
            a.codigo as articulo_codigo, a.nombre as articulo_nombre
     FROM demandas d
     JOIN articulos a ON a.id = d.articulo_id
     WHERE d.id = $1`,
    [id]
  );
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], ['cantidad', 'periodo']) : null;
}

async function crearDemanda({ articulo_id, periodo, cantidad }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Verificar que el artículo existe
    const articulo = await cliente.query('SELECT 1 FROM articulos WHERE id = $1', [articulo_id]);
    if (articulo.rows.length === 0) {
      throw new Error(`No existe el artículo con ID ${articulo_id}`);
    }

    const resultado = await cliente.query(
      `INSERT INTO demandas (articulo_id, periodo, cantidad)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [articulo_id, periodo, cantidad]
    );

    await cliente.query('COMMIT');
    return await obtenerDemandaPorId(resultado.rows[0].id);
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function actualizarDemanda(id, datos) {
  const campos = [];
  const valores = [];
  let idx = 1;

  const camposPermitidos = ['periodo', 'cantidad'];

  for (const [key, value] of Object.entries(datos)) {
    if (camposPermitidos.includes(key)) {
      campos.push(`${key} = $${idx}`);
      valores.push(value);
      idx++;
    }
  }

  if (campos.length === 0) {
    return null;
  }

  valores.push(id);
  const resultado = await pool.query(
    `UPDATE demandas SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
    valores
  );

  if (resultado.rows.length === 0) {
    return null;
  }

  return await obtenerDemandaPorId(id);
}

async function eliminarDemanda(id) {
  const resultado = await pool.query('DELETE FROM demandas WHERE id = $1 RETURNING *', [id]);
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], ['cantidad', 'periodo']) : null;
}

async function eliminarDemandasPorArticulo(articuloId) {
  const resultado = await pool.query('DELETE FROM demandas WHERE articulo_id = $1 RETURNING *', [articuloId]);
  return convertirArrayNumericos(resultado.rows, ['cantidad', 'periodo']);
}

// ==================== RECEPCIONES ====================

async function obtenerRecepciones(filtros = {}) {
  let query = `
    SELECT r.id, r.articulo_id, r.periodo, r.cantidad,
           a.codigo as articulo_codigo, a.nombre as articulo_nombre
    FROM recepciones r
    JOIN articulos a ON a.id = r.articulo_id
  `;
  const params = [];
  const condiciones = [];

  if (filtros.articuloId) {
    params.push(filtros.articuloId);
    condiciones.push(`r.articulo_id = $${params.length}`);
  }
  if (filtros.periodo !== undefined) {
    params.push(filtros.periodo);
    condiciones.push(`r.periodo = $${params.length}`);
  }

  if (condiciones.length > 0) {
    query += ' WHERE ' + condiciones.join(' AND ');
  }

  query += ' ORDER BY r.periodo, a.codigo';

  const resultado = await pool.query(query, params);
  return convertirArrayNumericos(resultado.rows, ['cantidad', 'periodo']);
}

async function obtenerRecepcionPorId(id) {
  const resultado = await pool.query(
    `SELECT r.id, r.articulo_id, r.periodo, r.cantidad,
            a.codigo as articulo_codigo, a.nombre as articulo_nombre
     FROM recepciones r
     JOIN articulos a ON a.id = r.articulo_id
     WHERE r.id = $1`,
    [id]
  );
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], ['cantidad', 'periodo']) : null;
}

async function crearRecepcion({ articulo_id, periodo, cantidad }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Verificar que el artículo existe
    const articulo = await cliente.query('SELECT 1 FROM articulos WHERE id = $1', [articulo_id]);
    if (articulo.rows.length === 0) {
      throw new Error(`No existe el artículo con ID ${articulo_id}`);
    }

    const resultado = await cliente.query(
      `INSERT INTO recepciones (articulo_id, periodo, cantidad)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [articulo_id, periodo, cantidad]
    );

    await cliente.query('COMMIT');
    return await obtenerRecepcionPorId(resultado.rows[0].id);
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function actualizarRecepcion(id, datos) {
  const campos = [];
  const valores = [];
  let idx = 1;

  const camposPermitidos = ['periodo', 'cantidad'];

  for (const [key, value] of Object.entries(datos)) {
    if (camposPermitidos.includes(key)) {
      campos.push(`${key} = $${idx}`);
      valores.push(value);
      idx++;
    }
  }

  if (campos.length === 0) {
    return null;
  }

  valores.push(id);
  const resultado = await pool.query(
    `UPDATE recepciones SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
    valores
  );

  if (resultado.rows.length === 0) {
    return null;
  }

  return await obtenerRecepcionPorId(id);
}

async function eliminarRecepcion(id) {
  const resultado = await pool.query('DELETE FROM recepciones WHERE id = $1 RETURNING *', [id]);
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], ['cantidad', 'periodo']) : null;
}

async function eliminarRecepcionesPorArticulo(articuloId) {
  const resultado = await pool.query('DELETE FROM recepciones WHERE articulo_id = $1 RETURNING *', [articuloId]);
  return convertirArrayNumericos(resultado.rows, ['cantidad', 'periodo']);
}

module.exports = {
  obtenerArticulos,
  obtenerArticuloPorId,
  obtenerArticuloPorCodigo,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  cambiarStock,
  // BOM
  obtenerBomDeArticulo,
  obtenerDondeSeUsa,
  obtenerBomPorId,
  crearBom,
  actualizarBom,
  eliminarBom,
  obtenerArbolBom,
  validarSinCiclos,
  // Demandas
  obtenerDemandas,
  obtenerDemandaPorId,
  crearDemanda,
  actualizarDemanda,
  eliminarDemanda,
  eliminarDemandasPorArticulo,
  // Recepciones
  obtenerRecepciones,
  obtenerRecepcionPorId,
  crearRecepcion,
  actualizarRecepcion,
  eliminarRecepcion,
  eliminarRecepcionesPorArticulo,
  // MRP
  obtenerDatosMrp,
};
