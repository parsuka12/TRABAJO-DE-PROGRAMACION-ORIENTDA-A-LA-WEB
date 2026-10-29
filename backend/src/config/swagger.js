const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API MRP Industrial',
      version: '1.0.0',
      description: 'Documentación interactiva del motor MRP y artículos.',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/routes/*.js'], // Busca los comentarios en la carpeta de rutas
};

module.exports = swaggerJsdoc(options);