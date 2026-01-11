const Joi = require('joi');
const { query } = require('../config/database');

const ventaSchema = Joi.object({
  cliente_id: Joi.string().required(),
  fecha: Joi.date().required(),
  total_venta: Joi.number().precision(2).min(0).required(),
  domicilio_id: Joi.string().allow(''),
  estado_id: Joi.string().required(),
  estado: Joi.string().required().min(2).max(20),
});

const validateVenta = (data) => ventaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM venta ORDER BY id DESC');
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
    const result = await query('SELECT * FROM venta WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
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
    const { error, value } = validateVenta(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { cliente_id, fecha, total_venta, domicilio_id, estado_id, estado } = value;
    
    const result = await query(
      'INSERT INTO venta (cliente_id, fecha, total_venta, domicilio_id, estado_id, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cliente_id, fecha, total_venta, domicilio_id || null, estado_id, estado]
    );

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateVenta(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { cliente_id, fecha, total_venta, domicilio_id, estado_id, estado } = value;
    
    const result = await query(
      'UPDATE venta SET cliente_id = $1, fecha = $2, total_venta = $3, domicilio_id = $4, estado_id = $5, estado = $6 WHERE id = $7 RETURNING *',
      [cliente_id, fecha, total_venta, domicilio_id || null, estado_id, estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Venta actualizada exitosamente',
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
      'UPDATE venta SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Venta ${result.rows[0].estado === 'Activo' ? 'activada' : 'desactivada'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteVenta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM venta WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
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
  deleteVenta
};
