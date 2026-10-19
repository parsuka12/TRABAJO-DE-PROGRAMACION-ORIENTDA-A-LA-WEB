
const express = require('express');
const router = express.Router();

const controlador = require('../controllers/articulos.controller');

// Consultar todos los artículos
router.get('/', controlador.listarArticulos);

// Consultar un artículo por su ID
router.get('/:id', controlador.buscarArticulo);

// Actualizar el stock de un artículo
router.put('/:id/stock', controlador.actualizarStock);

module.exports = router;
