
require('dotenv').config();

const express = require('express');
const articulosRoutes = require('./routes/articulos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ruta principal para comprobar que el servidor funciona
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del proyecto MRP Industrial funcionando'
  });
});

// Rutas de los artículos
app.use('/api/articulos', articulosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
