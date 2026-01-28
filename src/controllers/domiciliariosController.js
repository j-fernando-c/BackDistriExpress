const Joi = require("joi");
const { query } = require("../config/database");

const estadosPermitidos = ["disponible", "ocupado", "inactivo"];

const domiciliarioSchema = Joi.object({
  tipo_documento: Joi.string().max(30).allow(null, ""),
  documento: Joi.string().max(100).required(),
  nombre: Joi.string().min(2).max(200).required(),
  telefono: Joi.string().max(30).allow(null, ""),
  email: Joi.string().email().max(255).allow(null, ""),
  estado: Joi.string()
    .valid(...estadosPermitidos)
    .default("disponible"),
});

const estadoSchema = Joi.object({
  estado: Joi.string()
    .valid(...estadosPermitidos)
    .required(),
});

const validate = (schema, payload) =>
  schema.validate(payload, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, tipo_documento, documento, nombre, telefono, email, estado, fecha_creacion, fecha_actualizacion FROM domiciliarios ORDER BY fecha_creacion DESC",
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT id, tipo_documento, documento, nombre, telefono, email, estado, fecha_creacion, fecha_actualizacion FROM domiciliarios WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { error, value } = validate(domiciliarioSchema, req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { tipo_documento, documento, nombre, telefono, email, estado } =
      value;

    const result = await query(
      `INSERT INTO domiciliarios (tipo_documento, documento, nombre, telefono, email, estado)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'disponible'))
       RETURNING *`,
      [
        tipo_documento || null,
        documento,
        nombre,
        telefono || null,
        email || null,
        estado,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Domiciliario creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(domiciliarioSchema, req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { tipo_documento, documento, nombre, telefono, email, estado } =
      value;

    const result = await query(
      `UPDATE domiciliarios
       SET tipo_documento = $1, documento = $2, nombre = $3, telefono = $4, email = $5, estado = $6, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        tipo_documento || null,
        documento,
        nombre,
        telefono || null,
        email || null,
        estado,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Domiciliario actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(estadoSchema, req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
        errors: error.details.map((d) => d.message),
      });
    }

    const result = await query(
      `UPDATE domiciliarios
       SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [value.estado, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Estado actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM domiciliarios WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Domiciliario eliminado exitosamente",
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
  updateEstado,
  remove,
};
