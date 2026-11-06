const modelo = require('../models/model');
const {
  validarCrearDemanda,
  validarActualizarDemanda,
  validarCrearRecepcion,
  validarActualizarRecepcion,
  validarIdParam,
  validarArticuloIdParam,
} = require('../validations/demandas.validation');

const manejarErrorValidacion = (error, res) => {
  if (error.name === 'ZodError') {
    const detalles = error.issues.map((e) => ({
      campo: e.path.join('.'),
      mensaje: e.message,
    }));
    return res.status(400).json({ error: 'Datos inválidos', detalles });
  }
  if (error.message.includes('No existe el artículo')) {
    return res.status(404).json({ mensaje: error.message });
  }
  return null;
};

// ==================== DEMANDAS ====================

async function listarDemandas(req, res) {
  try {
    const { articuloId, periodo } = req.query;
    const filtros = {};
    if (articuloId) filtros.articuloId = Number(articuloId);
    if (periodo !== undefined) filtros.periodo = Number(periodo);

    const demandas = await modelo.obtenerDemandas(filtros);
    res.json(demandas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar las demandas' });
  }
}

async function obtenerDemanda(req, res) {
  try {
    const { id } = validarIdParam(req.params);
    const demanda = await modelo.obtenerDemandaPorId(id);

    if (!demanda) {
      return res.status(404).json({ mensaje: 'No se encontró la demanda' });
    }

    res.json(demanda);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al buscar la demanda' });
  }
}

async function crearDemanda(req, res) {
  try {
    const datos = validarCrearDemanda(req.body);
    const demanda = await modelo.crearDemanda(datos);

    res.status(201).json({
      mensaje: 'Demanda creada correctamente',
      demanda,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la demanda' });
  }
}

async function actualizarDemanda(req, res) {
  try {
    const { id } = validarIdParam(req.params);
    const datos = validarActualizarDemanda(req.body);

    const demanda = await modelo.actualizarDemanda(id, datos);

    if (!demanda) {
      return res.status(404).json({ mensaje: 'No se encontró la demanda' });
    }

    res.json({
      mensaje: 'Demanda actualizada correctamente',
      demanda,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la demanda' });
  }
}

async function eliminarDemanda(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    const demanda = await modelo.eliminarDemanda(id);

    if (!demanda) {
      return res.status(404).json({ mensaje: 'No se encontró la demanda' });
    }

    res.json({
      mensaje: 'Demanda eliminada correctamente',
      demanda,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar la demanda' });
  }
}

async function listarDemandasPorArticulo(req, res) {
  try {
    const { articuloId } = validarArticuloIdParam(req.params);
    const { periodo } = req.query;

    const articulo = await modelo.obtenerArticuloPorId(articuloId);
    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    const filtros = { articuloId };
    if (periodo !== undefined) filtros.periodo = Number(periodo);

    const demandas = await modelo.obtenerDemandas(filtros);
    res.json(demandas);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar demandas del artículo' });
  }
}

// ==================== RECEPCIONES ====================

async function listarRecepciones(req, res) {
  try {
    const { articuloId, periodo } = req.query;
    const filtros = {};
    if (articuloId) filtros.articuloId = Number(articuloId);
    if (periodo !== undefined) filtros.periodo = Number(periodo);

    const recepciones = await modelo.obtenerRecepciones(filtros);
    res.json(recepciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar las recepciones' });
  }
}

async function obtenerRecepcion(req, res) {
  try {
    const { id } = validarIdParam(req.params);
    const recepcion = await modelo.obtenerRecepcionPorId(id);

    if (!recepcion) {
      return res.status(404).json({ mensaje: 'No se encontró la recepción' });
    }

    res.json(recepcion);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al buscar la recepción' });
  }
}

async function crearRecepcion(req, res) {
  try {
    const datos = validarCrearRecepcion(req.body);
    const recepcion = await modelo.crearRecepcion(datos);

    res.status(201).json({
      mensaje: 'Recepción creada correctamente',
      recepcion,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la recepción' });
  }
}

async function actualizarRecepcion(req, res) {
  try {
    const { id } = validarIdParam(req.params);
    const datos = validarActualizarRecepcion(req.body);

    const recepcion = await modelo.actualizarRecepcion(id, datos);

    if (!recepcion) {
      return res.status(404).json({ mensaje: 'No se encontró la recepción' });
    }

    res.json({
      mensaje: 'Recepción actualizada correctamente',
      recepcion,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la recepción' });
  }
}

async function eliminarRecepcion(req, res) {
  try {
    const { id } = validarIdParam(req.params);

    const recepcion = await modelo.eliminarRecepcion(id);

    if (!recepcion) {
      return res.status(404).json({ mensaje: 'No se encontró la recepción' });
    }

    res.json({
      mensaje: 'Recepción eliminada correctamente',
      recepcion,
    });
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar la recepción' });
  }
}

async function listarRecepcionesPorArticulo(req, res) {
  try {
    const { articuloId } = validarArticuloIdParam(req.params);
    const { periodo } = req.query;

    const articulo = await modelo.obtenerArticuloPorId(articuloId);
    if (!articulo) {
      return res.status(404).json({ mensaje: 'No se encontró el artículo' });
    }

    const filtros = { articuloId };
    if (periodo !== undefined) filtros.periodo = Number(periodo);

    const recepciones = await modelo.obtenerRecepciones(filtros);
    res.json(recepciones);
  } catch (error) {
    const handled = manejarErrorValidacion(error, res);
    if (handled) return handled;

    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar recepciones del artículo' });
  }
}

module.exports = {
  // Demandas
  listarDemandas,
  obtenerDemanda,
  crearDemanda,
  actualizarDemanda,
  eliminarDemanda,
  listarDemandasPorArticulo,
  // Recepciones
  listarRecepciones,
  obtenerRecepcion,
  crearRecepcion,
  actualizarRecepcion,
  eliminarRecepcion,
  listarRecepcionesPorArticulo,
};