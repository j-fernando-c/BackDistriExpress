const Joi = require('joi');
const { query } = require('../config/database');

const detallePedidoSchema = Joi.object({
  pedido_id: Joi.string().uuid().required(),
  producto_id: Joi.string().uuid().required(),
  cantidad: Joi.number().integer().positive().required(),
  precio: Joi.number().precision(2).min(0).required(),
  subtotal: Joi.number().precision(2).min(0).required(),
});

const validateDetallePedido = (data) => detallePedidoSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT dp.*, 
       p.nombre as producto_nombre,
       ped.fecha as pedido_fecha,
       c.nombre as cliente_nombre
       FROM detalle_pedidos dp 
       LEFT JOIN productos p ON dp.producto_id = p.id 
       LEFT JOIN pedidos ped ON dp.pedido_id = ped.id
       LEFT JOIN clientes c ON ped.cliente_id = c.id
       ORDER BY dp.id DESC`
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
      `SELECT dp.*, 
       p.nombre as producto_nombre,
       ped.fecha as pedido_fecha,
       c.nombre as cliente_nombre
       FROM detalle_pedidos dp 
       LEFT JOIN productos p ON dp.producto_id = p.id 
       LEFT JOIN pedidos ped ON dp.pedido_id = ped.id
       LEFT JOIN clientes c ON ped.cliente_id = c.id
       WHERE dp.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de pedido no encontrado'
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

const getByPedidoId = async (req, res, next) => {
  try {
    const { pedido_id } = req.params;
    const result = await query(
      `SELECT dp.*, 
       p.nombre as producto_nombre
       FROM detalle_pedidos dp 
       LEFT JOIN productos p ON dp.producto_id = p.id 
       WHERE dp.pedido_id = $1
       ORDER BY dp.id`,
      [pedido_id]
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
    const { error, value } = validateDetallePedido(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { pedido_id, producto_id, cantidad, precio, subtotal } = value;
    
    const result = await query(
      `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio, subtotal) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pedido_id, producto_id, cantidad, precio, subtotal]
    );

    res.status(201).json({
      success: true,
      message: 'Detalle de pedido creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateDetallePedido(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { pedido_id, producto_id, cantidad, precio, subtotal } = value;
    
    const result = await query(
      `UPDATE detalle_pedidos 
       SET pedido_id = $1, producto_id = $2, cantidad = $3, precio = $4, subtotal = $5 
       WHERE id = $6 RETURNING *`,
      [pedido_id, producto_id, cantidad, precio, subtotal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de pedido actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteDetallePedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM detalle_pedidos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalle de pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de pedido eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByPedidoId,
  create,
  update,
  deleteDetallePedido
};
