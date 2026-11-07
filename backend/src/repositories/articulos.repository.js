const pool = require('../config/db');

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

const camposNumericosArticulo = ['stock', 'stock_seguridad', 'tiempo_entrega', 'lote_minimo', 'multiplo'];

// Consultar todos los articulos
async function obtenerArticulos() {
  const resultado = await pool.query(
    'SELECT * FROM articulos ORDER BY nombre'
  );
  return convertirArrayNumericos(resultado.rows, camposNumericosArticulo);
}

// Consultar un articulo por su id
async function obtenerArticuloPorId(id) {
  const resultado = await pool.query(
    'SELECT * FROM articulos WHERE id = $1',
    [id]
  );
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], camposNumericosArticulo) : null;
}

// Consultar un articulo por su codigo
async function obtenerArticuloPorCodigo(codigo) {
  const resultado = await pool.query(
    'SELECT * FROM articulos WHERE codigo = $1',
    [codigo]
  );
  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], camposNumericosArticulo) : null;
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
    return convertirNumericos(resultado.rows[0], camposNumericosArticulo);
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

  if (resultado.rows.length === 0) {
    return null;
  }

  return convertirNumericos(resultado.rows[0], camposNumericosArticulo);
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
    return resultado.rows[0] ? convertirNumericos(resultado.rows[0], camposNumericosArticulo) : null;
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

  return resultado.rows[0] ? convertirNumericos(resultado.rows[0], camposNumericosArticulo) : null;
}

module.exports = {
  obtenerArticulos,
  obtenerArticuloPorId,
  obtenerArticuloPorCodigo,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  cambiarStock,
};