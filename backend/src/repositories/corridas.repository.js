const pool = require('../config/database');

const corridasRepository = {
  async guardar(resultado, horizonte = null, usuarioId = null, client = null) {
    const db = client || pool;
    const query = `
      INSERT INTO corridas (fecha, horizonte, usuario_id, resultado)
      VALUES (NOW(), $1, $2, $3)
      RETURNING id, fecha, horizonte, usuario_id, resultado;
    `;
    const values = [horizonte, usuarioId, JSON.stringify(resultado)];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async listar(client = null) {
    const db = client || pool;
    const query = `SELECT id, fecha, horizonte, usuario_id, resultado FROM corridas ORDER BY fecha DESC;`;
    const { rows } = await db.query(query);
    return rows;
  }
};

module.exports = corridasRepository;