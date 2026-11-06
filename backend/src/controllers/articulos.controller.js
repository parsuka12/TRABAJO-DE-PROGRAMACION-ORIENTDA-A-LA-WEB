const modelo = require('../models/model');
const {
  validarCrearArticulo,
  validarActualizarArticulo,
  validarIdParam,
} = require('../validations/articulos.validation');

// Middleware de validación para Zod
const manejarErrorValidacion = (error, res) => {
  if (error.name === 'ZodError') {
    const detalles = error.errors.map((e) => ({
      campo: e.path.join('.'),
      mensaje: e.message,
    }));
    return res.status(400).json({ error: 'Datos inválidos', detalles });
  }
  if (error.message.includes('ya existe') || error.message.includes('Ya existe')) {
    return res.status(409).json({ mensaje: error.message });
  }
  if (error.message.includes('relaciones BOM') || error.message.includes('demandas asociadas') || error.message.includes('recepciones asociadas')) {
    return res.status(409).json({ mensaje: error.message });
  }
  return null;
};

// Consultar todos los artículos
async function listarArticulos(req, res) {
  try {
    const articulos = await modelo.obtenerArticulos();
    res.json(articulos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar los artículos' });
  }
}

// Consultar un artículo por su ID
async function buscarArticulo(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    const articulo = await modelo.obtenerArticuloPorId(id);

    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    res.json(articulo);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al buscar el artículo' });
  }
}

// Crear un nuevo artículo
async function crearArticulo(req, res) {
  try {
    const datos = validarCrearArticulo(req.body);

    const articulo = await modelo.crearArticulo(datos);

    res.status(201).json({
      mensaje: 'Artículo creado correctamente',
      articulo,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el artículo' });
  }
}

// Actualizar un artículo (parcial)
async function actualizarArticulo(req, res) {
  try {
    const { id } = validarIdParam(req.params);
    const datos = validarActualizarArticulo(req.body);

    const articulo = await modelo.actualizarArticulo(id, datos);

    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    res.json({
      mensaje: 'Artículo actualizado correctamente',
      articulo,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el artículo' });
  }
}

// Eliminar un artículo
async function eliminarArticulo(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    const articulo = await modelo.eliminarArticulo(id);

    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    res.json({
      mensaje: 'Artículo eliminado correctamente',
      articulo,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el artículo' });
  }
}

// Cambiar el stock de un artículo (endpoint legacy)
async function actualizarStock(req, res) {
  try {
    const { id } = validarIdParam(req.params);
    const stock = Number(req.body.stock);

    if (req.body.stock === undefined ||
        req.body.stock === null ||
        req.body.stock === '' ||
        !Number.isFinite(stock) ||
        stock < 0) {
      return res.status(400).json({
        mensaje: 'El stock debe ser un número mayor o igual a cero',
      });
    }

    const articulo = await modelo.cambiarStock(id, stock);

    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    res.json({
      mensaje: 'Stock actualizado correctamente',
      articulo,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el stock' });
  }
}

module.exports = {
  listarArticulos,
  buscarArticulo,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  actualizarStock,
};