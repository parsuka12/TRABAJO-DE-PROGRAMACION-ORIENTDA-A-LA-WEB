const { Router } = require('express');
const C = require('../controllers/mrp.controller');
const { requireRole } = require('../middleware/auth');

const router = Router();
const planner = requireRole('planificador');

/**
 * @swagger
 * /api/mrp/data:
 *   get: { summary: Ítems, BOM, recepciones y demanda guardados, tags: [MRP], responses: { 200: { description: OK } } }
 *   put:
 *     summary: Reemplaza todos los datos (solo planificador)
 *     tags: [MRP]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { items: { type: object }, demanda: { type: array, items: { type: object } } } } } } }
 *     responses: { 200: { description: Guardado }, 400: { description: Datos inválidos (ciclo en BOM, etc.) } }
 * /api/mrp/example:
 *   get: { summary: Datos de ejemplo, tags: [MRP], responses: { 200: { description: OK } } }
 * /api/mrp/stock/{codigo}:
 *   patch:
 *     summary: Actualiza el stock de un ítem (planificador o almacén)
 *     tags: [MRP]
 *     parameters: [{ in: path, name: codigo, required: true, schema: { type: string } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { stock: { type: number } } } } } }
 *     responses: { 200: { description: OK }, 404: { description: Ítem no existe } }
 * /api/mrp/run:
 *   post:
 *     summary: Ejecuta el MRP y guarda la corrida (solo planificador)
 *     tags: [MRP]
 *     requestBody: { content: { application/json: { schema: { type: object, properties: { horizonte: { type: integer, example: 12 } } } } } }
 *     responses: { 200: { description: Árbol, órdenes planificadas y tablas por periodo } }
 * /api/mrp/runs:
 *   get: { summary: Historial de corridas, tags: [MRP], responses: { 200: { description: OK } } }
 * /api/mrp/runs/{id}:
 *   get:
 *     summary: Resultado de una corrida
 *     tags: [MRP]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK }, 404: { description: No existe } }
 */
router.get('/data', C.getData);
router.put('/data', planner, C.saveData);
router.get('/example', C.example);
router.patch('/stock/:codigo', requireRole('planificador', 'almacen'), C.setStock);
router.post('/run', planner, C.run);
router.get('/runs', C.listRuns);
router.get('/runs/:id', C.getRun);

module.exports = router;
