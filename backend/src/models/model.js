
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

module.exports = {
  obtenerArticulos,
  obtenerArticuloPorId,
  cambiarStock
};
