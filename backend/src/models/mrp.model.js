const pool = require('../config/db');

const MrpModel = {
  async getData() {
    const items = {};
    const q = (sql) => pool.query(sql).then((r) => r.rows);
    for (const r of await q('SELECT * FROM items ORDER BY codigo')) {
      items[r.codigo] = { nombre: r.nombre, lead_time: r.lead_time, stock: r.stock, seguridad: r.seguridad,
        lote_min: r.lote_min, multiplo: r.multiplo, bom: [], recepciones: [] };
    }
    for (const r of await q('SELECT * FROM bom')) items[r.padre].bom.push({ item: r.hijo, qty: r.qty });
    for (const r of await q('SELECT * FROM recepciones ORDER BY id')) items[r.item].recepciones.push({ periodo: r.periodo, qty: r.qty });
    const demanda = (await q('SELECT item, periodo, qty FROM demanda ORDER BY id'));
    return { items, demanda };
  },

  // Reemplaza todo el modelo en una sola transacción
  async saveData({ items, demanda }) {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      for (const t of ['demanda', 'recepciones', 'bom', 'items']) await c.query(`DELETE FROM ${t}`);
      for (const [k, i] of Object.entries(items)) {
        await c.query('INSERT INTO items VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [k, i.nombre || '', i.lead_time || 0, i.stock || 0, i.seguridad || 0, i.lote_min || 0, i.multiplo || 0]);
      }
      for (const [k, i] of Object.entries(items)) {
        for (const h of i.bom || []) await c.query('INSERT INTO bom VALUES ($1,$2,$3)', [k, h.item, h.qty]);
        for (const r of i.recepciones || []) await c.query('INSERT INTO recepciones(item,periodo,qty) VALUES ($1,$2,$3)', [k, r.periodo, r.qty]);
      }
      for (const d of demanda || []) await c.query('INSERT INTO demanda(item,periodo,qty) VALUES ($1,$2,$3)', [d.item, d.periodo, d.qty]);
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  },

  async setStock(codigo, stock) {
    const { rowCount } = await pool.query('UPDATE items SET stock = $1 WHERE codigo = $2', [stock, codigo]);
    return rowCount > 0;
  },

  async saveRun(usuario, resultado) {
    const { rows } = await pool.query('INSERT INTO corridas(usuario, resultado) VALUES ($1,$2) RETURNING id',
      [usuario, JSON.stringify(resultado)]);
    return rows[0].id;
  },

  async listRuns() {
    const { rows } = await pool.query('SELECT id, usuario, fecha FROM corridas ORDER BY id DESC LIMIT 30');
    return rows;
  },

  async getRun(id) {
    const { rows } = await pool.query('SELECT resultado FROM corridas WHERE id = $1', [id]);
    return rows[0] ? rows[0].resultado : null;
  },
};

module.exports = MrpModel;
