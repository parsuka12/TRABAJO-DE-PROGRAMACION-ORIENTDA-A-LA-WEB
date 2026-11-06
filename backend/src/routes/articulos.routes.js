const { Router } = require('express');
const router = Router();

const controlador = require('../controllers/articulos.controller');

/**
 * @swagger
 * /api/articulos:
 *   get:
 *     summary: Consultar todos los artículos
 *     responses:
 *       200:
 *         description: Lista de artículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Articulo'
 */
router.get('/', controlador.listarArticulos);

/**
 * @swagger
 * /api/articulos:
 *   post:
 *     summary: Crear un nuevo artículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticuloInput'
 *     responses:
 *       201:
 *         description: Artículo creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Articulo'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Código duplicado
 */
router.post('/', controlador.crearArticulo);

/**
 * @swagger
 * /api/articulos/{id}:
 *   get:
 *     summary: Consultar un artículo por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Artículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Articulo'
 *       404:
 *         description: No encontrado
 */
router.get('/:id', controlador.buscarArticulo);

/**
 * @swagger
 * /api/articulos/{id}:
 *   put:
 *     summary: Actualizar un artículo (parcial)
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
 *             $ref: '#/components/schemas/ArticuloUpdate'
 *     responses:
 *       200:
 *         description: Artículo actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No encontrado
 *       409:
 *         description: Código duplicado
 */
router.put('/:id', controlador.actualizarArticulo);

/**
 * @swagger
 * /api/articulos/{id}:
 *   delete:
 *     summary: Eliminar un artículo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Artículo eliminado
 *       404:
 *         description: No encontrado
 *       409:
 *         description: Tiene dependencias (BOM, demandas, recepciones)
 */
router.delete('/:id', controlador.eliminarArticulo);

/**
 * @swagger
 * /api/articulos/{id}/stock:
 *   put:
 *     summary: Actualizar solo el stock de un artículo
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
 *             type: object
 *             required: [stock]
 *             properties:
 *               stock:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stock actualizado
 *       400:
 *         description: Stock inválido
 *       404:
 *         description: No encontrado
 */
router.put('/:id/stock', controlador.actualizarStock);

module.exports = router;