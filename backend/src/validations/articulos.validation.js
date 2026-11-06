const { z } = require('zod');

const codigoSchema = z.string()
  .min(1, 'El código es obligatorio')
  .max(30, 'El código no puede superar 30 caracteres')
  .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener mayúsculas, números, guiones y guiones bajos');

const nombreSchema = z.string()
  .min(1, 'El nombre es obligatorio')
  .max(100, 'El nombre no puede superar 100 caracteres');

const numeroNoNegativo = z.number()
  .finite('Debe ser un número válido')
  .min(0, 'No puede ser negativo');

const numeroPositivo = z.number()
  .finite('Debe ser un número válido')
  .positive('Debe ser mayor a 0');

const enteroNoNegativo = z.number()
  .int('Debe ser un número entero')
  .min(0, 'No puede ser negativo');

const articuloBaseSchema = {
  codigo: codigoSchema,
  nombre: nombreSchema,
  stock: numeroNoNegativo.default(0),
  stock_seguridad: numeroNoNegativo.default(0),
  tiempo_entrega: enteroNoNegativo.default(0),
  lote_minimo: numeroNoNegativo.default(0),
  multiplo: numeroPositivo.default(1),
};

const crearArticuloSchema = z.object(articuloBaseSchema).strict();

const actualizarArticuloSchema = z.object({
  codigo: codigoSchema.optional(),
  nombre: nombreSchema.optional(),
  stock: numeroNoNegativo.optional(),
  stock_seguridad: numeroNoNegativo.optional(),
  tiempo_entrega: enteroNoNegativo.optional(),
  lote_minimo: numeroNoNegativo.optional(),
  multiplo: numeroPositivo.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

const idParamSchema = z.object({
  id: z.string().transform((val) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('El ID debe ser un número entero positivo');
    }
    return num;
  }),
});

module.exports = {
  crearArticuloSchema,
  actualizarArticuloSchema,
  idParamSchema,
  validarCrearArticulo: (data) => crearArticuloSchema.parse(data),
  validarActualizarArticulo: (data) => actualizarArticuloSchema.parse(data),
  validarIdParam: (params) => idParamSchema.parse(params),
};