const Joi = require("joi");
const { query } = require("../config/database");

const rutasSchema = Joi.object({
  nombre_ruta: Joi.string().required().min(2).max(100),
  origen: Joi.string().required().min(2).max(100),
  destino: Joi.string().required().min(2).max(100),
  cliente_id: Joi.string().required(),
});

const validateRutas = (data) =>
  rutasSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM rutas r
      INNER JOIN clientes c ON r.cliente_id = c.id
      ORDER BY r.fecha_creacion DESC`,
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
        r.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM rutas r
      INNER JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
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
    const { error, value } = validateRutas(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nombre_ruta, origen, destino, cliente_id } = value;

    const result = await query(
      "INSERT INTO rutas (nombre_ruta, origen, destino, cliente_id, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre_ruta, origen, destino, cliente_id, "activa"],
    );

    // Obtener datos completos con información del cliente
    const rutaCompleta = await query(
      `SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM rutas r
      INNER JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({
      success: true,
      message: "Ruta creada exitosamente",
      data: rutaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateRutas(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nombre_ruta, origen, destino, cliente_id } = value;

    const result = await query(
      "UPDATE rutas SET nombre_ruta = $1, origen = $2, destino = $3, cliente_id = $4 WHERE id = $5 RETURNING *",
      [nombre_ruta, origen, destino, cliente_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    // Obtener datos completos con información del cliente
    const rutaCompleta = await query(
      `SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM rutas r
      INNER JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: "Ruta actualizada exitosamente",
      data: rutaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE rutas SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *",
      ["activa", "inactiva", id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    // Obtener datos completos con información del cliente
    const rutaCompleta = await query(
      `SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM rutas r
      INNER JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: `Ruta ${rutaCompleta.rows[0].estado === "activa" ? "activada" : "desactivada"} exitosamente`,
      data: rutaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteRutas = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM rutas WHERE id = $1 RETURNING *", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Ruta eliminada exitosamente",
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
  deleteRutas,
};
