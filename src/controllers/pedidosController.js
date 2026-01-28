const Joi = require("joi");
const { query } = require("../config/database");

const pedidosSchema = Joi.object({
  cliente_id: Joi.string().required(),
  domiciliario_id: Joi.string().optional().allow(null),
  fecha: Joi.date().required(),
  estado: Joi.string()
    .optional()
    .valid(
      "pendiente",
      "confirmado",
      "en_preparacion",
      "enviado",
      "entregado",
      "cancelado",
    )
    .default("pendiente"),
  total: Joi.number().precision(2).min(0).required(),
});

const validatePedidos = (data) =>
  pedidosSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.telefono as domiciliario_telefono
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN domiciliarios d ON p.domiciliario_id = d.id
      ORDER BY p.fecha_creacion DESC`,
    );
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
    const result = await query(
      `SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.telefono as domiciliario_telefono
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN domiciliarios d ON p.domiciliario_id = d.id
      WHERE p.id = $1`,
      [id],
    );

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

    const { cliente_id, domiciliario_id, fecha, estado, total } = value;

    const result = await query(
      "INSERT INTO pedidos (cliente_id, domiciliario_id, fecha, estado, total) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [cliente_id, domiciliario_id || null, fecha, estado, total],
    );

    // Obtener datos completos del pedido con información de cliente y domiciliario
    const pedidoCompleto = await query(
      `SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.telefono as domiciliario_telefono
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN domiciliarios d ON p.domiciliario_id = d.id
      WHERE p.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      data: pedidoCompleto.rows[0],
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

    const { cliente_id, domiciliario_id, fecha, estado, total } = value;

    const result = await query(
      "UPDATE pedidos SET cliente_id = $1, domiciliario_id = $2, fecha = $3, estado = $4, total = $5 WHERE id = $6 RETURNING *",
      [cliente_id, domiciliario_id || null, fecha, estado, total, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Obtener datos completos del pedido con información de cliente y domiciliario
    const pedidoCompleto = await query(
      `SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.telefono as domiciliario_telefono
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN domiciliarios d ON p.domiciliario_id = d.id
      WHERE p.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: "Pedido actualizado exitosamente",
      data: pedidoCompleto.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validEstados = [
      "pendiente",
      "confirmado",
      "en_preparacion",
      "enviado",
      "entregado",
      "cancelado",
    ];
    if (!estado || !validEstados.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido. Debe ser uno de: " + validEstados.join(", "),
      });
    }

    const result = await query(
      "UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Obtener datos completos del pedido con información de cliente y domiciliario
    const pedidoCompleto = await query(
      `SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.telefono as domiciliario_telefono
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN domiciliarios d ON p.domiciliario_id = d.id
      WHERE p.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: `Estado del pedido actualizado a: ${estado}`,
      data: pedidoCompleto.rows[0],
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
      [id],
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
