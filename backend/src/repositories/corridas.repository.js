const pool = require('../config/db');

const corridasRepository = {
  /**
   * Crea la tabla de corridas si no existe.
   * Llama a esta función al iniciar la aplicación o en los tests de setup.
   */
  async inicializarTabla() {
    const query = `
      CREATE TABLE IF NOT EXISTS corridas (
        id SERIAL PRIMARY KEY,
        fecha TIMESTAMP DEFAULT NOW(),
        horizonte INTEGER,
        usuario_id INTEGER,
        resultado JSONB
      );
    `;
    await pool.query(query);
  },

  /**
   * Guarda una corrida en la base de datos dentro de una transacción explícita.
   * @param {number} horizonte - Número de periodos del MRP
   * @param {number|null} usuarioId - ID del usuario que ejecutó la corrida
   * @param {object} resultado - Resultado del cálculo MRP (se almacena como JSONB)
   * @returns {object} La corrida insertada con id, fecha, horizonte, usuario_id, resultado
   */
  async guardar(horizonte, usuarioId, resultado) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO corridas (fecha, horizonte, usuario_id, resultado)
        VALUES (NOW(), $1, $2, $3)
        RETURNING id, fecha, horizonte, usuario_id, resultado;
      `;
      const values = [horizonte, usuarioId, JSON.stringify(resultado)];
      const { rows } = await client.query(query, values);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Consulta el historial de corridas ordenado por fecha descendente.
   * @returns {Array<object>} Lista de corridas
   */
  async listar() {
    const query = `SELECT id, fecha, horizonte, usuario_id, resultado FROM corridas ORDER BY fecha DESC;`;
    const { rows } = await pool.query(query);
    return rows;
  }
};

module.exports = corridasRepository;