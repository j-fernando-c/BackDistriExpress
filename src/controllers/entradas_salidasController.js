const Joi = require('joi');
const { query } = require('../config/database');

const entradaSalidaSchema = Joi.object({
  producto_id: Joi.string().uuid().required(),
  tipo: Joi.string().valid('entrada', 'salida').required(),
  cantidad: Joi.number().integer().positive().required(),
  precio: Joi.number().precision(2).min(0).required(),
  observaciones: Joi.string().allow('').max(500),
});

const validateEntradaSalida = (data) => entradaSalidaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT es.*, p.nombre as producto_nombre 
       FROM entradas_salidas es 
       LEFT JOIN productos p ON es.producto_id = p.id 
       ORDER BY es.fecha DESC`
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
      `SELECT es.*, p.nombre as producto_nombre 
       FROM entradas_salidas es 
       LEFT JOIN productos p ON es.producto_id = p.id 
       WHERE es.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrada/Salida no encontrada'
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
    const { error, value } = validateEntradaSalida(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { producto_id, tipo, cantidad, precio, observaciones } = value;
    
    // tipo_entrada_salida enum is defined in schema.sql: 'entrada', 'salida'
    const result = await query(
      `INSERT INTO entradas_salidas (producto_id, tipo, cantidad, precio, observaciones, estado) 
       VALUES ($1, $2::tipo_entrada_salida, $3, $4, $5, $6) RETURNING *`,
      [producto_id, tipo, cantidad, precio, observaciones || null, 'activo']
    );

    res.status(201).json({
      success: true,
      message: 'Entrada/Salida registrada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateEntradaSalida(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { producto_id, tipo, cantidad, precio, observaciones } = value;
    
    // tipo_entrada_salida enum is defined in schema.sql: 'entrada', 'salida'
    const result = await query(
      `UPDATE entradas_salidas 
       SET producto_id = $1, tipo = $2::tipo_entrada_salida, cantidad = $3, 
           precio = $4, observaciones = $5 
       WHERE id = $6 RETURNING *`,
      [producto_id, tipo, cantidad, precio, observaciones || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrada/Salida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Entrada/Salida actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    // tipo_estado_general enum is defined in schema.sql: 'activo', 'inactivo'
    const result = await query(
      `UPDATE entradas_salidas 
       SET estado = CASE 
         WHEN estado = 'activo'::tipo_estado_general THEN 'inactivo'::tipo_estado_general 
         ELSE 'activo'::tipo_estado_general 
       END 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrada/Salida no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Entrada/Salida ${result.rows[0].estado === 'activo' ? 'activada' : 'desactivada'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteEntradaSalida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM entradas_salidas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrada/Salida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Entrada/Salida eliminada exitosamente'
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
  deleteEntradaSalida
};
