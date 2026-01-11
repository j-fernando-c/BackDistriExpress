const Joi = require('joi');
const { query } = require('../config/database');

const estado_ventaSchema = Joi.object({
  estado: Joi.string().required().min(2).max(30),
});

const validateEstado_venta = (data) => estado_ventaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM estado_venta ORDER BY id DESC');
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
    const result = await query('SELECT * FROM estado_venta WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado de venta no encontrado'
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
    const { error, value } = validateEstado_venta(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { estado } = value;
    
    const result = await query(
      'INSERT INTO estado_venta (estado) VALUES ($1) RETURNING *',
      [estado]
    );

    res.status(201).json({
      success: true,
      message: 'Estado de venta creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateEstado_venta(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { estado } = value;
    
    const result = await query(
      'UPDATE estado_venta SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado de venta no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado de venta actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteEstado_venta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM estado_venta WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado de venta no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado de venta eliminado exitosamente'
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
  deleteEstado_venta
};
