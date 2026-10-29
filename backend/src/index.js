require('dotenv').config();
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const articulosRoutes = require('./routes/articulos.routes');
const mrpRoutes = require('./routes/mrp.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Ruta de documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => {
  res.json({ mensaje: 'API del proyecto MRP Industrial funcionando' });
});

app.use('/api/articulos', articulosRoutes);
app.use('/api/mrp', mrpRoutes);

// Exportamos app para pruebas, y solo escuchamos si es el archivo principal
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
    console.log(`Documentación Swagger en http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;