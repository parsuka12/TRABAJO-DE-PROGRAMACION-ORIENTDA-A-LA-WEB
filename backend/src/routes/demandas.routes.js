const { Router } = require('express');
const router = Router();

const controlador = require('../controllers/demandas.controller');

/**
 * @swagger
 * /api/demandas:
 *   get:
 *     summary: Listar todas las demandas (con filtros opcionales)
 *     parameters:
 *       - in: query
 *         name: articuloId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de demandas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Demanda'
 */
router.get('/demandas', controlador.listarDemandas);

/**
 * @swagger
 * /api/demandas:
 *   post:
 *     summary: Crear una nueva demanda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandaInput'
 *     responses:
 *       201:
 *         description: Demanda creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demanda'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Artículo no encontrado
 */
router.post('/demandas', controlador.crearDemanda);

/**
 * @swagger
 * /api/demandas/{id}:
 *   get:
 *     summary: Obtener una demanda por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Demanda encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demanda'
 *       404:
 *         description: No encontrada
 */
router.get('/demandas/:id', controlador.obtenerDemanda);

/**
 * @swagger
 * /api/demandas/{id}:
 *   put:
 *     summary: Actualizar una demanda (parcial)
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
 *             $ref: '#/components/schemas/DemandaUpdate'
 *     responses:
 *       200:
 *         description: Demanda actualizada
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No encontrada
 */
router.put('/demandas/:id', controlador.actualizarDemanda);

/**
 * @swagger
 * /api/demandas/{id}:
 *   delete:
 *     summary: Eliminar una demanda
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Demanda eliminada
 *       404:
 *         description: No encontrada
 */
router.delete('/demandas/:id', controlador.eliminarDemanda);

/**
 * @swagger
 * /api/articulos/{articuloId}/demandas:
 *   get:
 *     summary: Listar demandas de un artículo
 *     parameters:
 *       - in: path
 *         name: articuloId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de demandas del artículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Demanda'
 *       404:
 *         description: Artículo no encontrado
 */
router.get('/articulos/:articuloId/demandas', controlador.listarDemandasPorArticulo);

/**
 * @swagger
 * /api/recepciones:
 *   get:
 *     summary: Listar todas las recepciones (con filtros opcionales)
 *     parameters:
 *       - in: query
 *         name: articuloId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de recepciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recepcion'
 */
router.get('/recepciones', controlador.listarRecepciones);

/**
 * @swagger
 * /api/recepciones:
 *   post:
 *     summary: Crear una nueva recepción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecepcionInput'
 *     responses:
 *       201:
 *         description: Recepción creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recepcion'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Artículo no encontrado
 */
router.post('/recepciones', controlador.crearRecepcion);

/**
 * @swagger
 * /api/recepciones/{id}:
 *   get:
 *     summary: Obtener una recepción por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recepción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recepcion'
 *       404:
 *         description: No encontrada
 */
router.get('/recepciones/:id', controlador.obtenerRecepcion);

/**
 * @swagger
 * /api/recepciones/{id}:
 *   put:
 *     summary: Actualizar una recepción (parcial)
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
 *             $ref: '#/components/schemas/RecepcionUpdate'
 *     responses:
 *       200:
 *         description: Recepción actualizada
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No encontrada
 */
router.put('/recepciones/:id', controlador.actualizarRecepcion);

/**
 * @swagger
 * /api/recepciones/{id}:
 *   delete:
 *     summary: Eliminar una recepción
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recepción eliminada
 *       404:
 *         description: No encontrada
 */
router.delete('/recepciones/:id', controlador.eliminarRecepcion);

/**
 * @swagger
 * /api/articulos/{articuloId}/recepciones:
 *   get:
 *     summary: Listar recepciones de un artículo
 *     parameters:
 *       - in: path
 *         name: articuloId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de recepciones del artículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recepcion'
 *       404:
 *         description: Artículo no encontrado
 */
router.get('/articulos/:articuloId/recepciones', controlador.listarRecepcionesPorArticulo);

module.exports = router;