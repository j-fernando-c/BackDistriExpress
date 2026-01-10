const Joi = require('joi');
const { query } = require('../config/database');

const clienteSchema = Joi.object({
  tipoCliente: Joi.string().valid('Natural', 'Jurídico').required(),
  nombres: Joi.string().required().min(2).max(100),
  apellidos: Joi.string().allow('').max(100),
  email: Joi.string().email().required(),
  telefono: Joi.string().required().min(7).max(20),
  direccion: Joi.string().required().min(5).max(200),
  ciudad: Joi.string().required().min(2).max(50),
  nit: Joi.string().allow('').max(20),
  documento: Joi.string().allow('').max(20),
});

const validateCliente = (data) => clienteSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM clientes ORDER BY id DESC');
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
    const result = await query('SELECT * FROM clientes WHERE id = $1', [id]);
    
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

    const { tipoCliente, nombres,apellidos, email, telefono, direccion, ciudad, nit, documento } = value;
    
    const result = await query(
      `INSERT INTO clientes (tipoCliente, nombres, apellidos, email, telefono, direccion, ciudad, nit, documento, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tipoCliente, nombres,apellidos, email, telefono, direccion, ciudad, nit || null, documento || null, 'Activo']
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

    const { tipoCliente, nombres,apellidos, email, telefono, direccion, ciudad, nit, documento } = value;
    
    const result = await query(
      `UPDATE clientes SET tipoCliente = $1, nombres = $2, apellidos = $3, email = $4, telefono = $5, 
       direccion = $6, ciudad = $7, nit = $8, documento = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *`,
      [tipoCliente, nombres,apellidos, email, telefono, direccion, ciudad, nit || null, documento || null, id]
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
      'UPDATE clientes SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
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
    const result = await query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

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
