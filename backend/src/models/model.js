
const pool = require('../config/db');

// Consultar todos los articulos
async function obtenerArticulos() {
  const resultado = await pool.query(
    'SELECT * FROM articulos ORDER BY nombre'
  );

  return resultado.rows;
}

// Consultar un articulo por su id
async function obtenerArticuloPorId(id) {
  const resultado = await pool.query(
    'SELECT * FROM articulos WHERE id = $1',
    [id]
  );

  return resultado.rows[0] || null;
}

// Consultar un articulo por su codigo
async function obtenerArticuloPorCodigo(codigo) {
  const resultado = await pool.query(
    'SELECT * FROM articulos WHERE codigo = $1',
    [codigo]
  );

  return resultado.rows[0] || null;
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
  return resultado.rows;
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
  return resultado.rows;
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
  return resultado.rows[0] || null;
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
};
