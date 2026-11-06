const { Router } = require('express');
const { calcularMrp } = require('../controllers/mrp.controller');

const router = Router();

/**
 * @swagger
 * /api/mrp/run:
 *   post:
 *     summary: Ejecuta el cálculo del MRP usando demandas de la base de datos
 *     requestBody:
 *       required: true
 *       content:
 *         'application/json':
 *           schema:
 *             type: object
 *             required: [horizonte]
 *             properties:
 *               horizonte:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *                 description: Número de periodos a planificar
 *               item:
 *                 type: string
 *                 example: BICI
 *                 description: Código del artículo para filtrar (opcional). Si se omite, usa todas las demandas.
 *     responses:
 *       200:
 *         description: Cálculo exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 horizonte:
 *                   type: integer
 *                 orden_proceso:
 *                   type: array
 *                   items:
 *                     type: string
 *                 ordenes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 items:
 *                   type: object
 *                 kpis:
 *                   type: object
 *                   properties:
 *                     total_ordenes:
 *                       type: integer
 *                     ordenes_compra:
 *                       type: integer
 *                     ordenes_produccion:
 *                       type: integer
 *                     ordenes_atrasadas:
 *                       type: integer
 *                 demanda_utilizada:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Horizonte inválido
 *       404:
 *         description: Artículo no encontrado o sin demandas
 *       500:
 *         description: Error interno
 */
router.post('/run', calcularMrp);

module.exports = router;