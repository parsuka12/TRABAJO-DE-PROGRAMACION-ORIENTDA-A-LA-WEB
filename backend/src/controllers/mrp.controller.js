const MrpModel = require('../models/mrp.model');
const { mrp, validar, SAMPLE, MrpError } = require('../services/mrp.service');

const fail = (res, err) => {
  const known = err instanceof MrpError || err.code?.startsWith('22') || err.code?.startsWith('23');
  res.status(known ? 400 : 500).json({ success: false, message: err.message });
};

const MrpController = {
  async getData(req, res) {
    try { res.json({ success: true, data: await MrpModel.getData() }); } catch (e) { fail(res, e); }
  },

  example(req, res) { res.json({ success: true, data: SAMPLE }); },

  async saveData(req, res) {
    try {
      const { items, demanda = [] } = req.body;
      if (!items || typeof items !== 'object') throw new MrpError('items es requerido');
      validar(items);
      for (const d of demanda) {
        if (!items[d.item]) throw new MrpError(`Demanda de ítem inexistente '${d.item}'`);
        if (!Number.isInteger(d.periodo) || d.periodo < 0) throw new MrpError('periodo debe ser entero >= 0');
      }
      await MrpModel.saveData({ items, demanda });
      res.json({ success: true, message: 'Datos guardados' });
    } catch (e) { fail(res, e); }
  },

  async setStock(req, res) {
    try {
      const stock = Number(req.body.stock);
      if (!Number.isFinite(stock)) throw new MrpError('stock debe ser numérico');
      const ok = await MrpModel.setStock(req.params.codigo, stock);
      if (!ok) return res.status(404).json({ success: false, message: 'Ítem no existe' });
      res.json({ success: true, message: 'Stock actualizado' });
    } catch (e) { fail(res, e); }
  },

  async run(req, res) {
    try {
      const T = parseInt(req.body.horizonte, 10) || 12;
      if (T < 1 || T > 104) throw new MrpError('horizonte debe estar entre 1 y 104');
      const { items, demanda } = await MrpModel.getData();
      if (!Object.keys(items).length) throw new MrpError('No hay datos. Guarda ítems primero.');
      const result = mrp(items, demanda, T);
      result.id = await MrpModel.saveRun(req.user.name, result);
      res.json({ success: true, data: result });
    } catch (e) { fail(res, e); }
  },

  async listRuns(req, res) {
    try { res.json({ success: true, data: await MrpModel.listRuns() }); } catch (e) { fail(res, e); }
  },

  async getRun(req, res) {
    try {
      const r = await MrpModel.getRun(parseInt(req.params.id, 10));
      if (!r) return res.status(404).json({ success: false, message: 'Corrida no existe' });
      res.json({ success: true, data: r });
    } catch (e) { fail(res, e); }
  },
};

module.exports = MrpController;
