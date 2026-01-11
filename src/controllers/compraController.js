const Joi = require('joi');
const { query } = require('../config/database');

const compraSchema = Joi.object({
  proveedor_id: Joi.string().required(),
  estado: Joi.string().required().min(2).max(20),
  fecha: Joi.date().required(),
  factura_proveedor: Joi.string().allow('').max(50),
  total_compra: Joi.number().precision(2).min(0).required(),
});

const validateCompra = (data) => compraSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM compra ORDER BY id DESC');
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
    const result = await query('SELECT * FROM compra WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
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
    const { error, value } = validateCompra(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { proveedor_id, estado, fecha, factura_proveedor, total_compra } = value;
    
    const result = await query(
      'INSERT INTO compra (proveedor_id, estado, fecha, factura_proveedor, total_compra) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [proveedor_id, estado, fecha, factura_proveedor || null, total_compra]
    );

    res.status(201).json({
      success: true,
      message: 'Compra creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateCompra(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { proveedor_id, estado, fecha, factura_proveedor, total_compra } = value;
    
    const result = await query(
      'UPDATE compra SET proveedor_id = $1, estado = $2, fecha = $3, factura_proveedor = $4, total_compra = $5 WHERE id = $6 RETURNING *',
      [proveedor_id, estado, fecha, factura_proveedor || null, total_compra, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Compra actualizada exitosamente',
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
      'UPDATE compra SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Compra ${result.rows[0].estado === 'Activo' ? 'activada' : 'desactivada'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM compra WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Compra eliminada exitosamente'
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
  deleteCompra
};
