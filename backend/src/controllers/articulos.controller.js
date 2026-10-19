
const modelo = require('../models/model');

// Consultar todos los artículos
async function listarArticulos(req, res) {
  try {
    const articulos = await modelo.obtenerArticulos();
    res.json(articulos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al consultar los artículos'
    });
  }
}

// Consultar un artículo por su ID
async function buscarArticulo(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: 'El ID debe ser un número positivo'
      });
    }

    const articulo = await modelo.obtenerArticuloPorId(id);

    if (!articulo) {
      return res.status(404).json({
        mensaje: 'No se encontró el artículo'
      });
    }

    res.json(articulo);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al buscar el artículo'
    });
  }
}

// Cambiar el stock de un artículo
async function actualizarStock(req, res) {
  try {
    const id = Number(req.params.id);
    const stock = Number(req.body.stock);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: 'El ID debe ser un número positivo'
      });
    }

    if (req.body.stock === undefined ||
        req.body.stock === null ||
        req.body.stock === '' ||
        !Number.isFinite(stock) ||
        stock < 0) {
      return res.status(400).json({
        mensaje: 'El stock debe ser un número mayor o igual a cero'
      });
    }

    const articulo = await modelo.cambiarStock(id, stock);

    if (!articulo) {
      return res.status(404).json({
        mensaje: 'No se encontró el artículo'
      });
    }

    res.json({
      mensaje: 'Stock actualizado correctamente',
      articulo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al actualizar el stock'
    });
  }
}

module.exports = {
  listarArticulos,
  buscarArticulo,
  actualizarStock
};
