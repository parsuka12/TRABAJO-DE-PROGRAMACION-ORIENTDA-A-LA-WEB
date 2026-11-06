const { Router } = require('express');
const router = Router();

const controlador = require('../controllers/bom.controller');

/**
 * @swagger
 * /api/articulos/{id}/bom:
 *   get:
 *     summary: Obtener componentes directos de un artículo (BOM)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de componentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BomItem'
 *       404:
 *         description: Artículo no encontrado
 */
router.get('/articulos/:id/bom', controlador.obtenerBomDeArticulo);

/**
 * @swagger
 * /api/articulos/{id}/donde-se-usa:
 *   get:
 *     summary: Obtener en qué artículos se usa este artículo como componente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de artículos padre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BomItem'
 *       404:
 *         description: Artículo no encontrado
 */
router.get('/articulos/:id/donde-se-usa', controlador.obtenerDondeSeUsa);

/**
 * @swagger
 * /api/articulos/{id}/bom/arbol:
 *   get:
 *     summary: Obtener árbol BOM completo expandido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Árbol BOM jerárquico
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BomArbol'
 *       404:
 *         description: Artículo no encontrado
 *       409:
 *         description: Ciclo detectado en el BOM
 */
router.get('/articulos/:id/bom/arbol', controlador.obtenerArbolBom);

/**
 * @swagger
 * /api/bom:
 *   post:
 *     summary: Crear una nueva relación BOM
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BomInput'
 *     responses:
 *       201:
 *         description: Relación BOM creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BomItem'
 *       400:
 *         description: Datos inválidos o ciclo detectado
 *       404:
 *         description: Artículo o componente no encontrado
 *       409:
 *         description: Relación ya existe o crearía ciclo
 */
router.post('/bom', controlador.crearBom);

/**
 * @swagger
 * /api/bom/{id}:
 *   put:
 *     summary: Actualizar cantidad de una relación BOM
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BomUpdate'
 *     responses:
 *       200:
 *         description: Relación BOM actualizada
 *       400:
 *         description: Cantidad inválida
 *       404:
 *         description: Relación BOM no encontrada
 */
router.put('/bom/:id', controlador.actualizarBom);

/**
 * @swagger
 * /api/bom/{id}:
 *   delete:
 *     summary: Eliminar una relación BOM
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Relación BOM eliminada
 *       404:
 *         description: Relación BOM no encontrada
 */
router.delete('/bom/:id', controlador.eliminarBom);

module.exports = router;