// Motor MRP: explosión multinivel de BOM (recursiva) + netting por nivel bajo.
class MrpError extends Error { constructor(m) { super(m); this.name = 'MrpError'; } }

function validar(items) {
  const estado = {};
  const dfs = (c, ruta) => {
    if (estado[c] === 1) throw new MrpError('Ciclo en BOM: ' + [...ruta, c].join(' -> '));
    if (estado[c] === 2) return;
    estado[c] = 1;
    for (const h of items[c].bom || []) {
      if (!items[h.item]) throw new MrpError(`Componente inexistente '${h.item}' en '${c}'`);
      if (!(h.qty > 0)) throw new MrpError(`Cantidad inválida en BOM de '${c}'`);
      dfs(h.item, [...ruta, c]);
    }
    estado[c] = 2;
  };
  Object.keys(items).forEach((c) => dfs(c, []));
}

// Low-level code: nivel más profundo en que aparece cada ítem (recursivo)
function nivelBajo(items) {
  const llc = {};
  Object.keys(items).forEach((c) => (llc[c] = 0));
  const visita = (c, n) => {
    llc[c] = Math.max(llc[c], n);
    (items[c].bom || []).forEach((h) => visita(h.item, n + 1));
  };
  const hijos = new Set(Object.values(items).flatMap((i) => (i.bom || []).map((h) => h.item)));
  Object.keys(items).filter((c) => !hijos.has(c)).forEach((c) => visita(c, 0));
  return llc;
}

// Explosión recursiva del árbol (cantidad acumulada por rama)
function arbol(items, c, qty = 1, nivel = 0) {
  return {
    item: c, nombre: items[c].nombre || c, qty, nivel,
    hijos: (items[c].bom || []).map((h) => arbol(items, h.item, qty * h.qty, nivel + 1)),
  };
}

function lote(need, it) {
  const q = Math.max(need, it.lote_min || 0);
  const m = it.multiplo || 0;
  return m ? Math.ceil(q / m) * m : q;
}

function mrp(items, demanda, T) {
  validar(items);
  const llc = nivelBajo(items);
  const bruto = {};
  Object.keys(items).forEach((c) => (bruto[c] = Array(T).fill(0)));
  for (const d of demanda) {
    if (!items[d.item]) throw new MrpError(`Demanda de ítem inexistente '${d.item}'`);
    if (!(d.periodo >= 0 && d.periodo < T)) throw new MrpError('Periodo de demanda fuera del horizonte');
    bruto[d.item][d.periodo] += d.qty;
  }
  const res = {}, ordenes = [];
  const orden = Object.keys(items).sort((a, b) => llc[a] - llc[b] || a.localeCompare(b));
  for (const c of orden) {
    const it = items[c], lt = it.lead_time || 0, ss = it.seguridad || 0;
    const prog = Array(T).fill(0);
    (it.recepciones || []).forEach((r) => { if (r.periodo >= 0 && r.periodo < T) prog[r.periodo] += r.qty; });
    let oh = it.stock || 0;
    const proy = [], neto = Array(T).fill(0), rec = Array(T).fill(0), lanz = Array(T).fill(0);
    for (let t = 0; t < T; t++) {
      let p = oh + prog[t] - bruto[c][t];
      if (p < ss) {
        neto[t] = ss - p;
        rec[t] = lote(neto[t], it);
        p += rec[t];
        let lp = t - lt;
        const atrasada = lp < 0;
        lp = Math.max(lp, 0);
        lanz[lp] += rec[t];
        ordenes.push({ item: c, nombre: it.nombre || c, nivel: llc[c],
          tipo: (it.bom || []).length ? 'Producción' : 'Compra',
          qty: rec[t], lanzar: lp, recibir: t, atrasada });
        (it.bom || []).forEach((h) => { bruto[h.item][lp] += rec[t] * h.qty; });
      }
      proy.push(p); oh = p;
    }
    res[c] = { nombre: it.nombre || c, nivel: llc[c], lead_time: lt, bruto: bruto[c], recepciones: prog,
      proyectado: proy, neto, recepcion_plan: rec, lanzamiento: lanz };
  }
  ordenes.sort((a, b) => a.lanzar - b.lanzar || a.nivel - b.nivel);
  const hijos = new Set(Object.values(items).flatMap((i) => (i.bom || []).map((h) => h.item)));
  return { horizonte: T, items: res, ordenes,
    arboles: Object.keys(items).filter((c) => !hijos.has(c)).map((c) => arbol(items, c)),
    orden_proceso: orden };
}

const SAMPLE = { items: {
  BICI: { nombre: 'Bicicleta', lead_time: 1, stock: 10, bom: [{ item: 'CUADRO', qty: 1 }, { item: 'RUEDA', qty: 2 }, { item: 'MANUB', qty: 1 }] },
  CUADRO: { nombre: 'Cuadro', lead_time: 2, stock: 15, bom: [{ item: 'TUBO', qty: 3 }, { item: 'PINT', qty: 1 }] },
  RUEDA: { nombre: 'Rueda', lead_time: 1, stock: 40, bom: [{ item: 'LLANTA', qty: 1 }, { item: 'ARO', qty: 1 }, { item: 'RAYO', qty: 36 }] },
  MANUB: { nombre: 'Manubrio', lead_time: 2, stock: 20, seguridad: 5, lote_min: 50 },
  TUBO: { nombre: 'Tubo de acero', lead_time: 3, stock: 100, multiplo: 100, recepciones: [{ periodo: 2, qty: 200 }] },
  PINT: { nombre: 'Pintura (L)', lead_time: 2, stock: 30, lote_min: 40 },
  LLANTA: { nombre: 'Llanta', lead_time: 2, stock: 60 },
  ARO: { nombre: 'Aro', lead_time: 4, stock: 50, multiplo: 50 },
  RAYO: { nombre: 'Rayo', lead_time: 2, stock: 1000, multiplo: 1000 } },
  demanda: [{ item: 'BICI', periodo: 4, qty: 50 }, { item: 'BICI', periodo: 8, qty: 80 }, { item: 'BICI', periodo: 11, qty: 40 }] };

module.exports = { mrp, validar, SAMPLE, MrpError };
