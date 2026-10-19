
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