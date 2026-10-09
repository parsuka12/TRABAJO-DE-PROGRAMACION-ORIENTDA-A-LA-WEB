const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión (devuelve JWT)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: ana@empresa.com }
 *               password: { type: string, example: clave1 }
 *     responses:
 *       200: { description: Token y datos del usuario }
 *       401: { description: Credenciales incorrectas }
 */
router.post('/login', AuthController.login);

module.exports = router;
