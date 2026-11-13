require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const articulosRoutes = require('./routes/articulos.routes');
const bomRoutes = require('./routes/bom.routes');
const demandasRoutes = require('./routes/demandas.routes');
const mrpRoutes = require('./routes/mrp.routes');
const authRoutes = require('./routes/auth.routes');
const { auth, requireRole } = require('./middlewares/auth.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ mensaje: 'API del proyecto MRP Industrial funcionando' });
});

app.use('/api/articulos', auth, articulosRoutes);
app.use('/api', auth, bomRoutes);
app.use('/api', auth, demandasRoutes);
app.use('/api/mrp', auth, requireRole('planificador'), mrpRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
    console.log(`Documentación Swagger en http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;

const cookieParser = require('cookie-parser');

app.use(cookieParser());