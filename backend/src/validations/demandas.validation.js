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

const articuloIdParamSchema = z.object({
  articuloId: z.string().transform((val) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('El ID del artículo debe ser un número entero positivo');
    }
    return num;
  }),
});

const demandaBaseSchema = {
  articulo_id: z.number().int().positive('El ID del artículo debe ser un entero positivo'),
  periodo: z.number().int().min(0, 'El periodo debe ser mayor o igual a 0'),
  cantidad: z.number().finite('La cantidad debe ser un número válido').positive('La cantidad debe ser mayor a 0'),
};

const crearDemandaSchema = z.object(demandaBaseSchema).strict();

const actualizarDemandaSchema = z.object({
  periodo: z.number().int().min(0, 'El periodo debe ser mayor o igual a 0').optional(),
  cantidad: z.number().finite('La cantidad debe ser un número válido').positive('La cantidad debe ser mayor a 0').optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

const recepcionBaseSchema = {
  articulo_id: z.number().int().positive('El ID del artículo debe ser un entero positivo'),
  periodo: z.number().int().min(0, 'El periodo debe ser mayor o igual a 0'),
  cantidad: z.number().finite('La cantidad debe ser un número válido').positive('La cantidad debe ser mayor a 0'),
};

const crearRecepcionSchema = z.object(recepcionBaseSchema).strict();

const actualizarRecepcionSchema = z.object({
  periodo: z.number().int().min(0, 'El periodo debe ser mayor o igual a 0').optional(),
  cantidad: z.number().finite('La cantidad debe ser un número válido').positive('La cantidad debe ser mayor a 0').optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

module.exports = {
  crearDemandaSchema,
  actualizarDemandaSchema,
  crearRecepcionSchema,
  actualizarRecepcionSchema,
  idParamSchema,
  articuloIdParamSchema,
  validarCrearDemanda: (data) => crearDemandaSchema.parse(data),
  validarActualizarDemanda: (data) => actualizarDemandaSchema.parse(data),
  validarCrearRecepcion: (data) => crearRecepcionSchema.parse(data),
  validarActualizarRecepcion: (data) => actualizarRecepcionSchema.parse(data),
  validarIdParam: (params) => idParamSchema.parse(params),
  validarArticuloIdParam: (params) => articuloIdParamSchema.parse(params),
};