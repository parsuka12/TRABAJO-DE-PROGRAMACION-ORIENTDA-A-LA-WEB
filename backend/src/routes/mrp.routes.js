const { Router } = require('express');
const { calcularMrp } = require('../controllers/mrp.controller');

const router = Router();

// Endpoint para ejecutar el cálculo del MRP
router.post('/run', calcularMrp);

module.exports = router;