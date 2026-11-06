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
        BomItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            articulo_id: { type: 'integer', example: 1 },
            componente_id: { type: 'integer', example: 2 },
            cantidad: { type: 'number', format: 'float', example: 2 },
            articulo_codigo: { type: 'string', example: 'BICI' },
            articulo_nombre: { type: 'string', example: 'Bicicleta' },
            componente_codigo: { type: 'string', example: 'RUEDA' },
            componente_nombre: { type: 'string', example: 'Rueda' },
          },
        },
        BomInput: {
          type: 'object',
          required: ['articulo_id', 'componente_id', 'cantidad'],
          properties: {
            articulo_id: { type: 'integer', minimum: 1, example: 1 },
            componente_id: { type: 'integer', minimum: 1, example: 2 },
            cantidad: { type: 'number', minimum: 0.01, example: 2 },
          },
        },
        BomUpdate: {
          type: 'object',
          required: ['cantidad'],
          properties: {
            cantidad: { type: 'number', minimum: 0.01, example: 3 },
          },
        },
        BomArbol: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            codigo: { type: 'string', example: 'BICI' },
            nombre: { type: 'string', example: 'Bicicleta' },
            nivel: { type: 'integer', example: 0 },
            hijos: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/BomArbol',
              },
            },
            cantidad: { type: 'number', format: 'float', example: 2 },
            cantidad_total: { type: 'number', format: 'float', example: 2 },
          },
        },
        Demanda: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            articulo_id: { type: 'integer', example: 1 },
            periodo: { type: 'integer', example: 4 },
            cantidad: { type: 'number', format: 'float', example: 50 },
            articulo_codigo: { type: 'string', example: 'BICI' },
            articulo_nombre: { type: 'string', example: 'Bicicleta' },
          },
        },
        DemandaInput: {
          type: 'object',
          required: ['articulo_id', 'periodo', 'cantidad'],
          properties: {
            articulo_id: { type: 'integer', minimum: 1, example: 1 },
            periodo: { type: 'integer', minimum: 0, example: 4 },
            cantidad: { type: 'number', minimum: 0.01, example: 50 },
          },
        },
        DemandaUpdate: {
          type: 'object',
          properties: {
            periodo: { type: 'integer', minimum: 0, example: 5 },
            cantidad: { type: 'number', minimum: 0.01, example: 60 },
          },
        },
        Recepcion: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            articulo_id: { type: 'integer', example: 2 },
            periodo: { type: 'integer', example: 2 },
            cantidad: { type: 'number', format: 'float', example: 20 },
            articulo_codigo: { type: 'string', example: 'RUEDA' },
            articulo_nombre: { type: 'string', example: 'Rueda' },
          },
        },
        RecepcionInput: {
          type: 'object',
          required: ['articulo_id', 'periodo', 'cantidad'],
          properties: {
            articulo_id: { type: 'integer', minimum: 1, example: 2 },
            periodo: { type: 'integer', minimum: 0, example: 2 },
            cantidad: { type: 'number', minimum: 0.01, example: 20 },
          },
        },
        RecepcionUpdate: {
          type: 'object',
          properties: {
            periodo: { type: 'integer', minimum: 0, example: 3 },
            cantidad: { type: 'number', minimum: 0.01, example: 25 },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);