const Joi = require('joi');
const { query } = require('../config/database');

const detalleVentaSchema = Joi.object({
  venta_id: Joi.string().uuid().required(),
  producto_id: Joi.string().uuid().required(),
  cantidad: Joi.number().integer().positive().required(),
  precio_venta: Joi.number().precision(2).min(0).required(),
  subtotal: Joi.number().precision(2).min(0).required(),
});

const validateDetalleVenta = (data) => detalleVentaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT dv.*, 
       p.nombre as producto_nombre,
       v.fecha as venta_fecha,
       c.nombre as cliente_nombre
       FROM detalle_ventas dv 
       LEFT JOIN productos p ON dv.producto_id = p.id 
       LEFT JOIN ventas v ON dv.venta_id = v.id
       LEFT JOIN clientes c ON v.cliente_id = c.id
       ORDER BY dv.id DESC`
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
      `SELECT dv.*, 
       p.nombre as producto_nombre,
       v.fecha as venta_fecha,
       c.nombre as cliente_nombre
       FROM detalle_ventas dv 
       LEFT JOIN productos p ON dv.producto_id = p.id 
       LEFT JOIN ventas v ON dv.venta_id = v.id
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE dv.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de venta no encontrado'
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

const getByVentaId = async (req, res, next) => {
  try {
    const { venta_id } = req.params;
    const result = await query(
      `SELECT dv.*, 
       p.nombre as producto_nombre
       FROM detalle_ventas dv 
       LEFT JOIN productos p ON dv.producto_id = p.id 
       WHERE dv.venta_id = $1
       ORDER BY dv.id`,
      [venta_id]
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

const create = async (req, res, next) => {
  try {
    const { error, value } = validateDetalleVenta(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { venta_id, producto_id, cantidad, precio_venta, subtotal } = value;
    
    const result = await query(
      `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, subtotal) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [venta_id, producto_id, cantidad, precio_venta, subtotal]
    );

    res.status(201).json({
      success: true,
      message: 'Detalle de venta creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateDetalleVenta(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { venta_id, producto_id, cantidad, precio_venta, subtotal } = value;
    
    const result = await query(
      `UPDATE detalle_ventas 
       SET venta_id = $1, producto_id = $2, cantidad = $3, precio_venta = $4, subtotal = $5 
       WHERE id = $6 RETURNING *`,
      [venta_id, producto_id, cantidad, precio_venta, subtotal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de venta no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de venta actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteDetalleVenta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM detalle_ventas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de venta no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de venta eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByVentaId,
  create,
  update,
  deleteDetalleVenta
};
