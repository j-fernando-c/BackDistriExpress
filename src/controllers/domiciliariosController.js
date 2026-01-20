const Joi = require('joi');
const { query } = require('../config/database');

const domiciliarioSchema = Joi.object({
  tipo_documento: Joi.string().allow('').max(30),
  documento: Joi.string().required().min(5).max(100),
  nombre: Joi.string().required().min(2).max(200),
  telefono: Joi.string().allow('').max(30),
  email: Joi.string().email().allow('').max(255),
});

const validateDomiciliario = (data) => domiciliarioSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM domiciliarios ORDER BY fecha_creacion DESC');
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
    const result = await query('SELECT * FROM domiciliarios WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Domiciliario no encontrado'
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
    const { error, value } = validateDomiciliario(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { tipo_documento, documento, nombre, telefono, email } = value;
    
    const result = await query(
      `INSERT INTO domiciliarios (tipo_documento, documento, nombre, telefono, email, estado) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tipo_documento || null, documento, nombre, telefono || null, email || null, 'disponible']
    );

    res.status(201).json({
      success: true,
      message: 'Domiciliario creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateDomiciliario(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { tipo_documento, documento, nombre, telefono, email } = value;
    
    const result = await query(
      `UPDATE domiciliarios SET tipo_documento = $1, documento = $2, nombre = $3, 
       telefono = $4, email = $5, fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $6 RETURNING *`,
      [tipo_documento || null, documento, nombre, telefono || null, email || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Domiciliario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Domiciliario actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    // tipo_estado_domiciliario enum is defined in schema.sql: 'disponible', 'ocupado', 'inactivo'
    const result = await query(
      `UPDATE domiciliarios 
       SET estado = CASE 
         WHEN estado = 'disponible' THEN 'inactivo'::tipo_estado_domiciliario 
         ELSE 'disponible'::tipo_estado_domiciliario 
       END, 
       fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Domiciliario no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Domiciliario ${result.rows[0].estado === 'disponible' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteDomiciliario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM domiciliarios WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Domiciliario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Domiciliario eliminado exitosamente'
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
  deleteDomiciliario
};
