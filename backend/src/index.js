require('dotenv').config();

const path = require('path');
const express = require('express');
const articulosRoutes = require('./routes/articulos.routes');
const mrpRoutes = require('./routes/mrp.routes'); // <-- NUEVA LÍNEA

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend'))); 

app.get('/api/health', (req, res) => {
  res.json({ mensaje: 'API del proyecto MRP Industrial funcionando' });
});

app.use('/api/articulos', articulosRoutes);
app.use('/api/mrp', mrpRoutes); // <-- NUEVA LÍNEA

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});