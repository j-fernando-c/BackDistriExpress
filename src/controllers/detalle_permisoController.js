const Joi = require('joi');
const { query } = require('../config/database');

const detalle_permisoSchema = Joi.object({
  permiso_id: Joi.string().required(),
  rol_id: Joi.string().required(),
});

const validateDetalle_permiso = (data) => detalle_permisoSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM detalle_permiso ORDER BY id DESC');
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
    const result = await query('SELECT * FROM detalle_permiso WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de permiso no encontrado'
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
    const { error, value } = validateDetalle_permiso(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { permiso_id, rol_id } = value;
    
    const result = await query(
      'INSERT INTO detalle_permiso (permiso_id, rol_id) VALUES ($1, $2) RETURNING *',
      [permiso_id, rol_id]
    );

    res.status(201).json({
      success: true,
      message: 'Detalle de permiso creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateDetalle_permiso(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { permiso_id, rol_id } = value;
    
    const result = await query(
      'UPDATE detalle_permiso SET permiso_id = $1, rol_id = $2 WHERE id = $3 RETURNING *',
      [permiso_id, rol_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de permiso actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteDetalle_permiso = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM detalle_permiso WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de permiso eliminado exitosamente'
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
  deleteDetalle_permiso
};
