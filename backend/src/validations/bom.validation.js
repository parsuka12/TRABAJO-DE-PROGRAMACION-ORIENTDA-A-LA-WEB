const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().transform((val) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('El ID debe ser un número entero positivo');
    }
    return num;
  }),
});

const crearBomSchema = z.object({
  articulo_id: z.number().int().positive('El ID del artículo padre debe ser un entero positivo'),
  componente_id: z.number().int().positive('El ID del componente debe ser un entero positivo'),
  cantidad: z.number().finite('La cantidad debe ser un número válido').positive('La cantidad debe ser mayor a 0'),
}).strict().refine(
  (data) => data.articulo_id !== data.componente_id,
  { message: 'Un artículo no puede ser componente de sí mismo', path: ['componente_id'] }
);

const actualizarBomSchema = z.object({
  cantidad: z.number().finite('La cantidad debe ser un número válido').positive('La cantidad debe ser mayor a 0'),
}).strict();

const bomIdParamSchema = z.object({
  id: z.string().transform((val) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('El ID del BOM debe ser un número entero positivo');
    }
    return num;
  }),
  articuloId: z.string().transform((val) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('El ID del artículo debe ser un número entero positivo');
    }
    return num;
  }),
});

module.exports = {
  crearBomSchema,
  actualizarBomSchema,
  idParamSchema,
  bomIdParamSchema,
  validarCrearBom: (data) => crearBomSchema.parse(data),
  validarActualizarBom: (data) => actualizarBomSchema.parse(data),
  validarIdParam: (params) => idParamSchema.parse(params),
  validarBomIdParam: (params) => bomIdParamSchema.parse(params),
};