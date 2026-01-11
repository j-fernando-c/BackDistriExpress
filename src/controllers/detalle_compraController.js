const Joi = require('joi');
const { query } = require('../config/database');

const detalle_compraSchema = Joi.object({
  compra_id: Joi.string().required(),
  producto_id: Joi.string().required(),
  cantidad: Joi.number().integer().min(1).required(),
  precio_unitario: Joi.number().precision(2).positive().required(),
});

const validateDetalle_compra = (data) => detalle_compraSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM detalle_compra ORDER BY id DESC');
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
    const result = await query('SELECT * FROM detalle_compra WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de compra no encontrado'
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
    const { error, value } = validateDetalle_compra(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { compra_id, producto_id, cantidad, precio_unitario } = value;
    
    const result = await query(
      'INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4) RETURNING *',
      [compra_id, producto_id, cantidad, precio_unitario]
    );

    res.status(201).json({
      success: true,
      message: 'Detalle de compra creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateDetalle_compra(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { compra_id, producto_id, cantidad, precio_unitario } = value;
    
    const result = await query(
      'UPDATE detalle_compra SET compra_id = $1, producto_id = $2, cantidad = $3, precio_unitario = $4 WHERE id = $5 RETURNING *',
      [compra_id, producto_id, cantidad, precio_unitario, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de compra no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de compra actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteDetalle_compra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM detalle_compra WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de compra no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de compra eliminado exitosamente'
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
  deleteDetalle_compra
};
