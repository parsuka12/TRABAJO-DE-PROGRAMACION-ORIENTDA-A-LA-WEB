const { Router } = require('express');
const { calcularMrp } = require('../controllers/mrp.controller');
const { validarDemanda } = require('../middlewares/validarDemanda.middleware');
const { auth, requireRole } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimiter.middleware');

const router = Router();

/**
 * @swagger
 * /api/mrp/run:
 *   post:
 *     summary: Ejecuta el cálculo del MRP usando demandas de la base de datos
 *     security:
 *       - bearerAuth: []
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
 *         description: Horizonte inválido o datos incorrectos
 *       401:
 *         description: No autorizado (Falta token)
 *       403:
 *         description: Prohibido (Rol insuficiente)
 *       404:
 *         description: Artículo no encontrado o sin demandas
 *       500:
 *         description: Error interno
 */
router.post('/run', apiLimiter, auth, requireRole(['admin', 'planificador']), validarDemanda, calcularMrp);

module.exports = router;