const Joi = require('joi');
const { query } = require('../config/database');

const perdidaSchema = Joi.object({
  producto_id: Joi.string().uuid().required(),
  cantidad: Joi.number().integer().positive().required(),
  motivo: Joi.string().allow('').max(500),
  registrado_por: Joi.string().uuid().allow(null),
});

const validatePerdida = (data) => perdidaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, 
       prod.nombre as producto_nombre,
       u.nombre as registrado_por_nombre
       FROM perdidas p 
       LEFT JOIN productos prod ON p.producto_id = prod.id 
       LEFT JOIN usuarios u ON p.registrado_por = u.id
       ORDER BY p.fecha DESC`
    );
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
    const result = await query(
      `SELECT p.*, 
       prod.nombre as producto_nombre,
       u.nombre as registrado_por_nombre
       FROM perdidas p 
       LEFT JOIN productos prod ON p.producto_id = prod.id 
       LEFT JOIN usuarios u ON p.registrado_por = u.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pérdida no encontrada'
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
    const { error, value } = validatePerdida(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { producto_id, cantidad, motivo, registrado_por } = value;
    
    const result = await query(
      `INSERT INTO perdidas (producto_id, cantidad, motivo, registrado_por) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [producto_id, cantidad, motivo || null, registrado_por || null]
    );

    res.status(201).json({
      success: true,
      message: 'Pérdida registrada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validatePerdida(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { producto_id, cantidad, motivo, registrado_por } = value;
    
    const result = await query(
      `UPDATE perdidas 
       SET producto_id = $1, cantidad = $2, motivo = $3, registrado_por = $4 
       WHERE id = $5 RETURNING *`,
      [producto_id, cantidad, motivo || null, registrado_por || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pérdida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Pérdida actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deletePerdida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM perdidas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pérdida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Pérdida eliminada exitosamente'
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
  deletePerdida
};
