const Joi = require('joi');
const { query } = require('../config/database');

const rolesSchema = Joi.object({
  nombre_rol: Joi.string().required().min(2).max(50),
  descripcion: Joi.string().allow('').max(500),
});

const validateRoles = (data) => rolesSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM roles ORDER BY id DESC');
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
    const result = await query('SELECT * FROM roles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
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
    const { error, value } = validateRoles(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre_rol, descripcion } = value;
    
    const result = await query(
      'INSERT INTO roles (nombre_rol, descripcion, estado) VALUES ($1, $2, $3) RETURNING *',
      [nombre_rol, descripcion || null, 'Activo']
    );

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateRoles(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre_rol, descripcion } = value;
    
    const result = await query(
      'UPDATE roles SET nombre_rol = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [nombre_rol, descripcion || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
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
      'UPDATE roles SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Rol ${result.rows[0].estado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
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
  deleteRoles
};
