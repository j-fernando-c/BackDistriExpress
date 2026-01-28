const Joi = require("joi");
const { query } = require("../config/database");

const entradaSalidaSchema = Joi.object({
  producto_id: Joi.string().required(),
  tipo: Joi.string().required().valid("entrada", "salida"),
  cantidad: Joi.number().integer().min(1).required(),
  precio: Joi.number().precision(2).min(0).required(),
  estado: Joi.string().optional().valid("activo", "inactivo").default("activo"),
  observaciones: Joi.string().optional().max(500),
});

const validateEntradaSalida = (data) =>
  entradaSalidaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        es.*,
        p.nombre as producto_nombre,
        p.precio as precio_producto,
        c.nombre_categoria
      FROM entradas_salidas es
      INNER JOIN productos p ON es.producto_id = p.id
      LEFT JOIN categoria_productos c ON p.categoria_id = c.id
      ORDER BY es.fecha DESC`,
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
        es.*,
        p.nombre as producto_nombre,
        p.precio as precio_producto,
        c.nombre_categoria
      FROM entradas_salidas es
      INNER JOIN productos p ON es.producto_id = p.id
      LEFT JOIN categoria_productos c ON p.categoria_id = c.id
      WHERE es.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entrada/Salida no encontrada",
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
    const { error, value } = validateEntradaSalida(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { producto_id, tipo, cantidad, precio, estado, observaciones } =
      value;

    const result = await query(
      "INSERT INTO entradas_salidas (producto_id, tipo, cantidad, precio, estado, observaciones) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [producto_id, tipo, cantidad, precio, estado, observaciones || null],
    );

    // Obtener datos completos con información del producto
    const entradaSalidaCompleta = await query(
      `SELECT 
        es.*,
        p.nombre as producto_nombre,
        p.precio as precio_producto,
        c.nombre_categoria
      FROM entradas_salidas es
      INNER JOIN productos p ON es.producto_id = p.id
      LEFT JOIN categoria_productos c ON p.categoria_id = c.id
      WHERE es.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({
      success: true,
      message: `${tipo === "entrada" ? "Entrada" : "Salida"} registrada exitosamente`,
      data: entradaSalidaCompleta.rows[0],
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
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { producto_id, tipo, cantidad, precio, estado, observaciones } =
      value;

    const result = await query(
      "UPDATE entradas_salidas SET producto_id = $1, tipo = $2, cantidad = $3, precio = $4, estado = $5, observaciones = $6 WHERE id = $7 RETURNING *",
      [producto_id, tipo, cantidad, precio, estado, observaciones || null, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entrada/Salida no encontrada",
      });
    }

    // Obtener datos completos con información del producto
    const entradaSalidaCompleta = await query(
      `SELECT 
        es.*,
        p.nombre as producto_nombre,
        p.precio as precio_producto,
        c.nombre_categoria
      FROM entradas_salidas es
      INNER JOIN productos p ON es.producto_id = p.id
      LEFT JOIN categoria_productos c ON p.categoria_id = c.id
      WHERE es.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: "Entrada/Salida actualizada exitosamente",
      data: entradaSalidaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validEstados = ["activo", "inactivo"];
    if (!estado || !validEstados.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido. Debe ser: activo o inactivo",
      });
    }

    const result = await query(
      "UPDATE entradas_salidas SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entrada/Salida no encontrada",
      });
    }

    // Obtener datos completos con información del producto
    const entradaSalidaCompleta = await query(
      `SELECT 
        es.*,
        p.nombre as producto_nombre,
        p.precio as precio_producto,
        c.nombre_categoria
      FROM entradas_salidas es
      INNER JOIN productos p ON es.producto_id = p.id
      LEFT JOIN categoria_productos c ON p.categoria_id = c.id
      WHERE es.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: `Estado actualizado a: ${estado}`,
      data: entradaSalidaCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteEntradaSalida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM entradas_salidas WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entrada/Salida no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Entrada/Salida eliminada exitosamente",
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
  deleteEntradaSalida,
};
