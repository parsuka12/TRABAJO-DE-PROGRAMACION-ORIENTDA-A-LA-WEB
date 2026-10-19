
class MrpError extends Error {}
 
// 1) Validar el BOM: componentes existentes, cantidades > 0 y sin ciclos
function validar(items) {
  for (const [codigo, it] of Object.entries(items)) {
    for (const h of it.bom || []) {
      if (!items[h.item]) throw new MrpError(`${codigo} usa un componente que no existe: ${h.item}`);
      if (!(h.qty > 0)) throw new MrpError(`Cantidad inválida de ${h.item} en ${codigo}`);
    }
  }
  const estado = {}; // 1 = visitando, 2 = terminado
  const visitar = (c, ruta) => {
    if (estado[c] === 2) return;
    if (estado[c] === 1) throw new MrpError(`Ciclo en el BOM: ${[...ruta, c].join(' -> ')}`);
    estado[c] = 1;
    for (const h of items[c].bom || []) visitar(h.item, [...ruta, c]);
    estado[c] = 2;
  };
  Object.keys(items).forEach((c) => visitar(c, []));
}
 
// 2) Nivel bajo: el nivel más profundo en el que aparece cada ítem
function nivelBajo(items) {
  const llc = {};
  Object.keys(items).forEach((c) => (llc[c] = 0));
  const hijos = new Set();
  Object.values(items).forEach((it) => (it.bom || []).forEach((h) => hijos.add(h.item)));
  const bajar = (c, n) => {
    llc[c] = Math.max(llc[c], n);
    for (const h of items[c].bom || []) bajar(h.item, n + 1);
  };
  Object.keys(items).filter((c) => !hijos.has(c)).forEach((c) => bajar(c, 0));
  return llc;
}
 
// 3) Explosión recursiva: árbol con la cantidad acumulada por unidad final
function arbol(items, codigo, qty = 1, nivel = 0) {
  return {
    item: codigo,
    nombre: items[codigo].nombre,
    qty,
    nivel,
       hijos: (items[codigo].bom || []).map((h) => arbol(items, h.item, qty * h.qty, nivel + 1)),
  };
}

// 4) Tamaño de lote: mínimo y múltiplo
function lote(necesidad, it) {
  let q = Math.max(necesidad, it.lote_min || 0);
  if (it.multiplo > 0) q = Math.ceil(q / it.multiplo) * it.multiplo;
  return q;
}

// 5) Algoritmo principal
function mrp(items, demanda, T) {
  validar(items);
  const llc = nivelBajo(items);
  const bruto = {};
  Object.keys(items).forEach((c) => (bruto[c] = Array(T).fill(0)));
  for (const d of demanda) {
    if (d.periodo < 0 || d.periodo >= T) continue;
    bruto[d.item][d.periodo] += d.qty;
  }

  const orden = Object.keys(items).sort((a, b) => llc[a] - llc[b] || a.localeCompare(b));
  const ordenes = [];
  const detalle = {};

  for (const c of orden) {
    const it = items[c];
    const lt = it.lead_time || 0;
    const ss = it.seguridad || 0;
    const prog = Array(T).fill(0);
    (it.recepciones || []).forEach((r) => { if (r.periodo >= 0 && r.periodo < T) prog[r.periodo] += r.qty; });

    const neto = Array(T).fill(0), recPlan = Array(T).fill(0), lanz = Array(T).fill(0), proy = [];
    let oh = it.stock || 0;

    for (let t = 0; t < T; t++) {
      let p = oh + prog[t] - bruto[c][t];
      if (p < ss) {
        neto[t] = ss - p;
        const rec = lote(neto[t], it);
        p += rec;
        recPlan[t] = rec;
        let lp = t - lt;
        const atrasada = lp < 0;
        if (atrasada) lp = 0;
        lanz[lp] += rec;
        ordenes.push({
          item: c, nombre: it.nombre, nivel: llc[c], qty: rec,
          lanzar: lp, recibir: t, atrasada,
          tipo: (it.bom || []).length ? 'Producción' : 'Compra',
        });
        for (const h of it.bom || []) bruto[h.item][lp] += rec * h.qty; // explosión a los hijos
      }
      proy.push(p);
      oh = p;
    }
    detalle[c] = { nivel: llc[c], bruto: bruto[c], recepciones: prog, proyectado: proy, neto, recepcion_plan: recPlan, lanzamiento: lanz };
  }
  ordenes.sort((a, b) => a.lanzar - b.lanzar || a.nivel - b.nivel);
  return { horizonte: T, orden_proceso: orden, ordenes, items: detalle };
}

module.exports = { MrpError, validar, nivelBajo, arbol, lote, mrp };
