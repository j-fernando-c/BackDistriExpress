const Joi = require('joi');
const { query } = require('../config/database');

const permisosSchema = Joi.object({
  nombre_permisos: Joi.string().required().min(2).max(100),
  url: Joi.string().required().min(2).max(150),
  descripcion: Joi.string().allow('').max(500),
});

const validatePermisos = (data) => permisosSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM permisos ORDER BY id DESC');
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
    const result = await query('SELECT * FROM permisos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
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
    const { error, value } = validatePermisos(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre_permisos, url, descripcion } = value;
    
    const result = await query(
      'INSERT INTO permisos (nombre_permisos, url, descripcion, estado) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_permisos, url, descripcion || null, 'Activo']
    );

    res.status(201).json({
      success: true,
      message: 'Permiso creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validatePermisos(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre_permisos, url, descripcion } = value;
    
    const result = await query(
      'UPDATE permisos SET nombre_permisos = $1, url = $2, descripcion = $3 WHERE id = $4 RETURNING *',
      [nombre_permisos, url, descripcion || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Permiso actualizado exitosamente',
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
      'UPDATE permisos SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Permiso ${result.rows[0].estado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deletePermisos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM permisos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Permiso eliminado exitosamente'
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
  deletePermisos
};
