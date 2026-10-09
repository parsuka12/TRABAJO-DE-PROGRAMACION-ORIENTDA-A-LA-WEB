require('dotenv').config();
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const runMigrations = require('./config/migrate');
const { auth, requireRole } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const mrpRoutes = require('./routes/mrp.routes');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en .env');
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));   // frontend en "/"

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/health', (req, res) => res.json({ message: 'API corriendo', docs: '/api-docs' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, requireRole('planificador'), userRoutes);
app.use('/api/mrp', auth, mrpRoutes);

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Swagger en  http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();
