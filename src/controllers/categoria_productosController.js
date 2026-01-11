const Joi = require('joi');
const { query } = require('../config/database');

const categoria_productosSchema = Joi.object({
  nombre_categoria: Joi.string().required().min(2).max(100),
  descripcion: Joi.string().allow('').max(500),
});

const validateCategoria_productos = (data) => categoria_productosSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categoria_productos ORDER BY id DESC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM categoria_productos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { error, value } = validateCategoria_productos(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre_categoria, descripcion } = value;
    
    const result = await query(
      'INSERT INTO categoria_productos (nombre_categoria, descripcion, estado) VALUES ($1, $2, $3) RETURNING *',
      [nombre_categoria, descripcion || null, 'Activo']
    );

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateCategoria_productos(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre_categoria, descripcion } = value;
    
    const result = await query(
      'UPDATE categoria_productos SET nombre_categoria = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [nombre_categoria, descripcion || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE categoria_productos SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Categoría ${result.rows[0].estado === 'Activo' ? 'activada' : 'desactivada'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategoria_productos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM categoria_productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  toggleEstado,
  deleteCategoria_productos
};
