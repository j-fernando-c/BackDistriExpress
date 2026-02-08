const Joi = require("joi");
const { query } = require("../config/database");

const compraSchema = Joi.object({
  proveedor_id: Joi.string().required(),
  estado: Joi.string().required().min(2).max(20),
  fecha: Joi.date().required(),
  factura_proveedor: Joi.string().allow("").max(50),
  total_compra: Joi.number().precision(2).min(0).required(),
});

const validateCompra = (data) =>
  compraSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, p.nombre_o_razon_social, p.telefono, p.email
       FROM compras c 
       LEFT JOIN proveedores p ON c.proveedor_id = p.id 
       ORDER BY c.id DESC
       `,
    );

    // Obtener todos los detalles de compras con información de productos
    const detallesResult = await query(
      `SELECT d.*, 
              pr.nombre AS producto_nombre,
              pr.descripcion AS producto_descripcion,
              pr.precio AS producto_precio,
              pr.cantidad AS producto_stock,
              pr.categoria_id AS producto_categoria_id,
              pr.estado AS producto_estado
       FROM detalle_compras d
       INNER JOIN productos pr ON d.producto_id = pr.id
       ORDER BY d.compra_id, d.id DESC`,
    );

    // Agrupar detalles por compra_id
    const detallesPorCompra = {};
    detallesResult.rows.forEach((detalle) => {
      if (!detallesPorCompra[detalle.compra_id]) {
        detallesPorCompra[detalle.compra_id] = [];
      }
      detallesPorCompra[detalle.compra_id].push(detalle);
    });

    // Adicionar productos a cada compra
    const comprasConProductos = result.rows.map((compra) => ({
      ...compra,
      productos: detallesPorCompra[compra.id] || [],
      productos_count: (detallesPorCompra[compra.id] || []).length,
    }));

    res.json({
      success: true,
      data: comprasConProductos,
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
      `SELECT c.*, p.nombre_o_razon_social, p.telefono, p.email
       FROM compras c 
       LEFT JOIN proveedores p ON c.proveedor_id = p.id 
       WHERE c.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada",
      });
    }

    const detalleResult = await query(
      `SELECT d.*, 
              pr.nombre AS producto_nombre,
              pr.descripcion AS producto_descripcion,
              pr.precio AS producto_precio,
              pr.cantidad AS producto_stock,
              pr.categoria_id AS producto_categoria_id,
              pr.estado AS producto_estado
       FROM detalle_compras d
       INNER JOIN productos pr ON d.producto_id = pr.id
       WHERE d.compra_id = $1
       ORDER BY d.id DESC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        productos: detalleResult.rows,
        productos_count: detalleResult.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { error, value } = validateCompra(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { proveedor_id, estado, fecha, factura_proveedor, total_compra } =
      value;

    const result = await query(
      "INSERT INTO compras (proveedor_id, estado, fecha, factura_proveedor, total_compra) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [proveedor_id, estado, fecha, factura_proveedor || null, total_compra],
    );

    // Obtener la compra con información del proveedor
    const compraCompleta = await query(
      `SELECT c.*, p.nombre_o_razon_social, p.telefono, p.email
       FROM compras c 
       LEFT JOIN proveedores p ON c.proveedor_id = p.id 
       WHERE c.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({
      success: true,
      message: "Compra creada exitosamente",
      data: compraCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateCompra(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { proveedor_id, estado, fecha, factura_proveedor, total_compra } =
      value;

    const result = await query(
      "UPDATE compras SET proveedor_id = $1, estado = $2, fecha = $3, factura_proveedor = $4, total_compra = $5 WHERE id = $6 RETURNING *",
      [
        proveedor_id,
        estado,
        fecha,
        factura_proveedor || null,
        total_compra,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada",
      });
    }

    // Obtener la compra con información del proveedor
    const compraCompleta = await query(
      `SELECT c.*, p.nombre_o_razon_social, p.telefono, p.email
       FROM compras c 
       LEFT JOIN proveedores p ON c.proveedor_id = p.id 
       WHERE c.id = $1`,
      [id],
    );

    res.json({
      success: true,
      message: "Compra actualizada exitosamente",
      data: compraCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body.estado;

    // Validar que el nuevo estado sea válido
    const estadosValidos = ["pendiente", "completada", "cancelada"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message:
          "Estado inválido. Los estados válidos son: pendiente, completada, cancelada",
      });
    }

    const result = await query(
      "UPDATE compras SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada",
      });
    }

    // Obtener la compra con información del proveedor
    const compraCompleta = await query(
      `SELECT c.*, p.nombre_o_razon_social, p.telefono, p.email
       FROM compras c 
       LEFT JOIN proveedores p ON c.proveedor_id = p.id 
       WHERE c.id = $1`,
      [id],
    );

    res.json({
      success: true,
      message: `Estado de compra actualizado a ${estado} exitosamente`,
      data: compraCompleta.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM compras WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Compra eliminada exitosamente",
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
  deleteCompra,
};
