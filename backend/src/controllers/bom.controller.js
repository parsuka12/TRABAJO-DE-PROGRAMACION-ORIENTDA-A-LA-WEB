const ArticulosRepository = require('../repositories/articulos.repository');
const modelo = require('../models/model');
const {
  validarCrearBom,
  validarActualizarBom,
  validarIdParam,
  validarBomIdParam,
} = require('../validations/bom.validation');

// Middleware de validación para Zod
const manejarErrorValidacion = (error, res) => {
  if (error.name === 'ZodError') {
    const detalles = error.errors.map((e) => ({
      campo: e.path.join('.'),
      mensaje: e.message,
    }));
    return res.status(400).json({ error: 'Datos inválidos', detalles });
  }
  if (error.message.includes('ciclo') || error.message.includes('Ciclo')) {
    return res.status(409).json({ mensaje: error.message });
  }
  if (error.message.includes('Ya existe') || error.message.includes('ya existe')) {
    return res.status(409).json({ mensaje: error.message });
  }
  if (error.message.includes('No existe')) {
    return res.status(404).json({ mensaje: error.message });
  }
  if (error.message.includes('no puede ser componente de sí mismo')) {
    return res.status(400).json({ mensaje: error.message });
  }
  return null;
};

// Obtener BOM de un artículo (componentes directos)
async function obtenerBomDeArticulo(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    // Verificar que el artículo existe
    const articulo = await ArticulosRepository.obtenerArticuloPorId(id);
    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    const bom = await modelo.obtenerBomDeArticulo(id);
    res.json(bom);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar el BOM' });
  }
}

// Obtener donde se usa un artículo (padres)
async function obtenerDondeSeUsa(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    const articulo = await ArticulosRepository.obtenerArticuloPorId(id);
    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    const padres = await modelo.obtenerDondeSeUsa(id);
    res.json(padres);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar dónde se usa el artículo' });
  }
}

// Obtener árbol BOM completo (expandido)
async function obtenerArbolBom(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    const articulo = await ArticulosRepository.obtenerArticuloPorId(id);
    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    const arbol = await modelo.obtenerArbolBom(id);
    if (!arbol) {
      return res.status(404).json({ mensaje: 'No se pudo generar el árbol BOM' });
    }
    if (arbol.error) {
      return res.status(409).json({ mensaje: arbol.error });
    }

    res.json(arbol);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar el árbol BOM' });
  }
}

// Crear una relación BOM
async function crearBom(req, res) {
  try {
    const datos = validarCrearBom(req.body);

    const bom = await modelo.crearBom(datos);

    res.status(201).json({
      mensaje: 'Relación BOM creada correctamente',
      bom,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la relación BOM' });
  }
}

// Actualizar cantidad de una relación BOM
async function actualizarBom(req, res) {
  try {
    const { id } = validarBomIdParam(req.params);
    const { cantidad } = validarActualizarBom(req.body);

    const bom = await modelo.actualizarBom(id, cantidad);

    if (!bom) {
      return res.status(404).json({ mensaje: 'No se encontró la relación BOM' });
    }

    res.json({
      mensaje: 'Relación BOM actualizada correctamente',
      bom,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la relación BOM' });
  }
}

// Eliminar una relación BOM
async function eliminarBom(req, res) {
  try {
    const { id } = validarBomIdParam(req.params);

    const bom = await modelo.eliminarBom(id);

    if (!bom) {
      return res.status(404).json({ mensaje: 'No se encontró la relación BOM' });
    }

    res.json({
      mensaje: 'Relación BOM eliminada correctamente',
      bom,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar la relación BOM' });
  }
}

module.exports = {
  obtenerBomDeArticulo,
  obtenerDondeSeUsa,
  obtenerArbolBom,
  crearBom,
  actualizarBom,
  eliminarBom,
};