const { Router } = require('express');
const { calcularMrp } = require('../controllers/mrp.controller');

const router = Router();

/**
 * @swagger
 * /api/mrp/run:
 *   post:
 *     summary: Ejecuta el cálculo del MRP
 *     description: Calcula la explosión de materiales y devuelve las órdenes de compra/producción.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horizonte:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Cálculo exitoso devolviendo el JSON con las órdenes.
 */
router.post('/run', calcularMrp);

module.exports = router;