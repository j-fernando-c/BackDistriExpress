const Joi = require('joi');
const { query } = require('../config/database');

const productoSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  category: Joi.string().required().min(2).max(50),
  unit: Joi.string().required().min(2).max(30),
  qty: Joi.number().integer().min(0).required(),
  price: Joi.number().min(0).required(),
});

const validateProducto = (data) => productoSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM productos ORDER BY id DESC');
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
    const result = await query('SELECT * FROM productos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
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
    const { error, value } = validateProducto(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { name, category, unit, qty, price } = value;
    const result = await query(
      'INSERT INTO productos (name, category, unit, qty, price, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, unit, qty, price, 'Activo']
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateProducto(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { name, category, unit, qty, price } = value;
    const result = await query(
      'UPDATE productos SET name = $1, category = $2, unit = $3, qty = $4, price = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, category, unit, qty, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
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
      'UPDATE productos SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Producto ${result.rows[0].estado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
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
  deleteProducto
};
