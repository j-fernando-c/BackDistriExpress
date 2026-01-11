const Joi = require('joi');
const { query } = require('../config/database');

const clienteSchema = Joi.object({
  nombre: Joi.string().required().min(2).max(100),
  documento: Joi.string().required().min(5).max(30),
  tipo_documento: Joi.string().required().min(2).max(20),
  email: Joi.string().email().required(),
  telefono: Joi.string().allow('').max(20),
  direccion: Joi.string().allow('').max(500),
});

const validateCliente = (data) => clienteSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM cliente ORDER BY id DESC');
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
    const result = await query('SELECT * FROM cliente WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
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
    const { error, value } = validateCliente(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre, documento, tipo_documento, email, telefono, direccion } = value;
    
    const result = await query(
      `INSERT INTO cliente (nombre, documento, tipo_documento, email, telefono, direccion, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, documento, tipo_documento, email, telefono || null, direccion || null, 'Activo']
    );

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateCliente(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { nombre, documento, tipo_documento, email, telefono, direccion } = value;
    
    const result = await query(
      `UPDATE cliente SET nombre = $1, documento = $2, tipo_documento = $3, email = $4, 
       telefono = $5, direccion = $6 WHERE id = $7 RETURNING *`,
      [nombre, documento, tipo_documento, email, telefono || null, direccion || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
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
      'UPDATE cliente SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Cliente ${result.rows[0].estado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM cliente WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
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
  deleteCliente
};
