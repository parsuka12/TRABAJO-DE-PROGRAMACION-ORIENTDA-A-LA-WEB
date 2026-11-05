const { Router } = require('express');
const { calcularMrp } = require('../controllers/mrp.controller');
const { validarDemanda } = require('../middlewares/validarDemanda.middleware');

const router = Router();

/**
 * @swagger
 * /api/mrp/run:
 *   post:
 *     summary: Ejecuta el cálculo del MRP con datos reales
 *     requestBody:
 *       required: true
 *       content:
 *         'application/json':
 *           schema:
 *             type: object
 *             properties:
 *               horizonte: { type: integer, example: 10 }
 *               item: { type: string, example: BICI }
 *               periodo: { type: integer, example: 4 }
 *               qty: { type: number, example: 50 }
 *     responses:
 *       200:
 *         description: Cálculo exitoso.
 */
router.post('/run', validarDemanda, calcularMrp);

module.exports = router;