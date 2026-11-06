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
    components: {
      schemas: {
        Articulo: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            codigo: { type: 'string', example: 'BICI' },
            nombre: { type: 'string', example: 'Bicicleta' },
            stock: { type: 'number', format: 'float', example: 10 },
            stock_seguridad: { type: 'number', format: 'float', example: 0 },
            tiempo_entrega: { type: 'integer', example: 1 },
            lote_minimo: { type: 'number', format: 'float', example: 0 },
            multiplo: { type: 'number', format: 'float', example: 1 },
          },
        },
        ArticuloInput: {
          type: 'object',
          required: ['codigo', 'nombre'],
          properties: {
            codigo: { type: 'string', pattern: '^[A-Z0-9_-]+$', maxLength: 30, example: 'BICI' },
            nombre: { type: 'string', maxLength: 100, example: 'Bicicleta' },
            stock: { type: 'number', minimum: 0, default: 0, example: 10 },
            stock_seguridad: { type: 'number', minimum: 0, default: 0, example: 0 },
            tiempo_entrega: { type: 'integer', minimum: 0, default: 0, example: 1 },
            lote_minimo: { type: 'number', minimum: 0, default: 0, example: 0 },
            multiplo: { type: 'number', minimum: 0.01, default: 1, example: 1 },
          },
        },
        ArticuloUpdate: {
          type: 'object',
          properties: {
            codigo: { type: 'string', pattern: '^[A-Z0-9_-]+$', maxLength: 30, example: 'BICI' },
            nombre: { type: 'string', maxLength: 100, example: 'Bicicleta' },
            stock: { type: 'number', minimum: 0, example: 10 },
            stock_seguridad: { type: 'number', minimum: 0, example: 0 },
            tiempo_entrega: { type: 'integer', minimum: 0, example: 1 },
            lote_minimo: { type: 'number', minimum: 0, example: 0 },
            multiplo: { type: 'number', minimum: 0.01, example: 1 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            mensaje: { type: 'string' },
            error: { type: 'string' },
            detalles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  campo: { type: 'string' },
                  mensaje: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);