const Joi = require("joi");
const { query } = require("../config/database");

const pedidosSchema = Joi.object({
  producto_id: Joi.string().required(),
  estado: Joi.string().required().min(2).max(20),
  fecha: Joi.date().required(),
  cantidad_productos: Joi.number().integer().min(1).required(),
  total_pedido: Joi.number().precision(2).min(0).required(),
});

const validatePedidos = (data) =>
  pedidosSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM pedidos ORDER BY id DESC");
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM pedidos WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
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
    const { error, value } = validatePedidos(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { producto_id, estado, fecha, cantidad_productos, total_pedido } =
      value;

    const result = await query(
      "INSERT INTO pedidos (producto_id, estado, fecha, cantidad_productos, total_pedido) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [producto_id, estado, fecha, cantidad_productos, total_pedido]
    );

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validatePedidos(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { producto_id, estado, fecha, cantidad_productos, total_pedido } =
      value;

    const result = await query(
      "UPDATE pedidos SET producto_id = $1, estado = $2, fecha = $3, cantidad_productos = $4, total_pedido = $5 WHERE id = $6 RETURNING *",
      [producto_id, estado, fecha, cantidad_productos, total_pedido, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Pedido actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE pedidos SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *",
      ["Activo", "Inactivo", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    res.json({
      success: true,
      message: `Pedido ${
        result.rows[0].estado === "Activo" ? "activado" : "desactivado"
      } exitosamente`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deletePedidos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM pedidos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Pedido eliminado exitosamente",
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
  deletePedidos,
};
