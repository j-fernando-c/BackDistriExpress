const Joi = require("joi");
const { query } = require("../config/database");

const zonasSchema = Joi.object({
  cliente_id: Joi.string().required(),
  ruta_id: Joi.string().required(),
});

const validateZonas = (data) =>
  zonasSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        z.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        r.nombre_ruta,
        r.origen,
        r.destino
      FROM zonas z
      INNER JOIN clientes c ON z.cliente_id = c.id
      INNER JOIN rutas r ON z.ruta_id = r.id
      ORDER BY z.fecha_asignacion DESC`,
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
      `SELECT 
        z.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        r.nombre_ruta,
        r.origen,
        r.destino
      FROM zonas z
      INNER JOIN clientes c ON z.cliente_id = c.id
      INNER JOIN rutas r ON z.ruta_id = r.id
      WHERE z.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Zona no encontrada",
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
    const { error, value } = validateZonas(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { cliente_id, ruta_id } = value;

    const result = await query(
      "INSERT INTO zonas (cliente_id, ruta_id) VALUES ($1, $2) RETURNING *",
      [cliente_id, ruta_id],
    );

    // Obtener datos completos con información de cliente y ruta
    const zonaCompleta = await query(
      `SELECT 
        z.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        r.nombre_ruta,
        r.origen,
        r.destino
      FROM zonas z
      INNER JOIN clientes c ON z.cliente_id = c.id
      INNER JOIN rutas r ON z.ruta_id = r.id
      WHERE z.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({
      success: true,
      message: "Zona creada exitosamente",
      data: zonaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateZonas(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { cliente_id, ruta_id } = value;

    const result = await query(
      "UPDATE zonas SET cliente_id = $1, ruta_id = $2 WHERE id = $3 RETURNING *",
      [cliente_id, ruta_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Zona no encontrada",
      });
    }

    // Obtener datos completos con información de cliente y ruta
    const zonaCompleta = await query(
      `SELECT 
        z.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        r.nombre_ruta,
        r.origen,
        r.destino
      FROM zonas z
      INNER JOIN clientes c ON z.cliente_id = c.id
      INNER JOIN rutas r ON z.ruta_id = r.id
      WHERE z.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: "Zona actualizada exitosamente",
      data: zonaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteZonas = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM zonas WHERE id = $1 RETURNING *", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Zona no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Zona eliminada exitosamente",
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
  deleteZonas,
};
