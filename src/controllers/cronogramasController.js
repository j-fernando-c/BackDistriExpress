const Joi = require('joi');
const { query } = require('../config/database');

const cronogramasSchema = Joi.object({
  ruta_id: Joi.string().required(),
  usuario_id: Joi.string().required(),
  fecha: Joi.date().required(),
  hora: Joi.string().required(),
});

const validateCronogramas = (data) => cronogramasSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM cronogramas ORDER BY id DESC');
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
    const result = await query('SELECT * FROM cronogramas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cronograma no encontrado'
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
    const { error, value } = validateCronogramas(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { ruta_id, usuario_id, fecha, hora } = value;
    
    const result = await query(
      'INSERT INTO cronogramas (ruta_id, usuario_id, fecha, hora, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ruta_id, usuario_id, fecha, hora, 'Activo']
    );

    res.status(201).json({
      success: true,
      message: 'Cronograma creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateCronogramas(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    const { ruta_id, usuario_id, fecha, hora } = value;
    
    const result = await query(
      'UPDATE cronogramas SET ruta_id = $1, usuario_id = $2, fecha = $3, hora = $4 WHERE id = $5 RETURNING *',
      [ruta_id, usuario_id, fecha, hora, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cronograma no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cronograma actualizado exitosamente',
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
      'UPDATE cronogramas SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *',
      ['Activo', 'Inactivo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cronograma no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Cronograma ${result.rows[0].estado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteCronogramas = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM cronogramas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cronograma no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cronograma eliminado exitosamente'
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
  deleteCronogramas
};
