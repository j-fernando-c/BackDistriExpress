const Joi = require("joi");
const { query } = require("../config/database");

const estadosVenta = ["pendiente", "pagada", "cancelada", "entregada"];

const productoVentaSchema = Joi.object({
  producto_id: Joi.string().required(),
  cantidad: Joi.number().integer().min(1).required(),
  precio_unitario: Joi.number().precision(2).min(0).required(),
  precio_venta: Joi.number().precision(2).min(0).optional(),
});

const ventaSchema = Joi.object({
  cliente_id: Joi.string().required(),
  fecha: Joi.date().required(),
  total_venta: Joi.number().precision(2).min(0).required(),
  domiciliario_id: Joi.string().allow("", null),
  estado_id: Joi.string().optional(),
  estado: Joi.string()
    .valid(...estadosVenta)
    .optional()
    .default("pendiente"),
  productos: Joi.array().items(productoVentaSchema).optional(),
});

const estadoVentaSchema = Joi.object({
  estado: Joi.string()
    .valid(...estadosVenta)
    .required(),
});

const validateVenta = (data) =>
  ventaSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        v.*,
        c.nombre as cliente_nombre,
        c.documento as cliente_documento,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.documento as domiciliario_documento,
        d.telefono as domiciliario_telefono,
        dv.id as detalle_id,
        dv.producto_id as detalle_producto_id,
        dv.cantidad as detalle_cantidad,
        dv.precio_venta as detalle_precio_venta,
        dv.subtotal as detalle_subtotal,
        p.nombre as detalle_producto_nombre
      FROM ventas v
      INNER JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN domiciliarios d ON v.domiciliario_id = d.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      LEFT JOIN productos p ON dv.producto_id = p.id
      ORDER BY v.id DESC, dv.id
    `);

    // Agrupar detalles por venta
    const ventasMap = new Map();
    result.rows.forEach((row) => {
      const ventaId = row.id;
      if (!ventasMap.has(ventaId)) {
        const venta = { ...row };
        delete venta.detalle_id;
        delete venta.detalle_producto_id;
        delete venta.detalle_cantidad;
        delete venta.detalle_precio_venta;
        delete venta.detalle_subtotal;
        delete venta.detalle_producto_nombre;
        venta.detalle_ventas = [];
        ventasMap.set(ventaId, venta);
      }

      if (row.detalle_id) {
        ventasMap.get(ventaId).detalle_ventas.push({
          id: row.detalle_id,
          producto_id: row.detalle_producto_id,
          producto_nombre: row.detalle_producto_nombre,
          cantidad: row.detalle_cantidad,
          precio_venta: row.detalle_precio_venta,
          subtotal: row.detalle_subtotal,
        });
      }
    });

    const data = Array.from(ventasMap.values());
    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `
      SELECT 
        v.*,
        c.nombre as cliente_nombre,
        c.documento as cliente_documento,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.documento as domiciliario_documento,
        d.telefono as domiciliario_telefono,
        dv.id as detalle_id,
        dv.producto_id as detalle_producto_id,
        dv.cantidad as detalle_cantidad,
        dv.precio_venta as detalle_precio_venta,
        dv.subtotal as detalle_subtotal,
        p.nombre as detalle_producto_nombre
      FROM ventas v
      INNER JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN domiciliarios d ON v.domiciliario_id = d.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      LEFT JOIN productos p ON dv.producto_id = p.id
      WHERE v.id = $1
      ORDER BY dv.id
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    // Construir venta con detalles anidados
    const firstRow = result.rows[0];
    const venta = { ...firstRow };
    delete venta.detalle_id;
    delete venta.detalle_producto_id;
    delete venta.detalle_cantidad;
    delete venta.detalle_precio_venta;
    delete venta.detalle_subtotal;
    delete venta.detalle_producto_nombre;

    venta.detalle_ventas = result.rows
      .filter((row) => row.detalle_id)
      .map((row) => ({
        id: row.detalle_id,
        producto_id: row.detalle_producto_id,
        producto_nombre: row.detalle_producto_nombre,
        cantidad: row.detalle_cantidad,
        precio_venta: row.detalle_precio_venta,
        subtotal: row.detalle_subtotal,
      }));

    res.json({
      success: true,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { error, value } = validateVenta(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const {
      cliente_id,
      fecha,
      total_venta,
      domiciliario_id,
      estado_id,
      estado,
      productos,
    } = value;

    // Insertar venta
    const ventaResult = await query(
      "INSERT INTO ventas (cliente_id, fecha, total_venta, domiciliario_id, estado_id, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        cliente_id,
        fecha,
        total_venta,
        domiciliario_id || null,
        estado_id || null,
        estado,
      ],
    );

    const venta_id = ventaResult.rows[0].id;

    // Insertar detalles de venta si hay productos
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        await query(
          "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, subtotal) VALUES ($1, $2, $3, $4, $5)",
          [
            venta_id,
            producto.producto_id,
            producto.cantidad,
            producto.precio_unitario,
            producto.cantidad * producto.precio_unitario,
          ],
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Venta creada exitosamente",
      data: ventaResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateVenta(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const {
      cliente_id,
      fecha,
      total_venta,
      domiciliario_id,
      estado_id,
      estado,
      productos,
    } = value;

    const result = await query(
      "UPDATE ventas SET cliente_id = $1, fecha = $2, total_venta = $3, domiciliario_id = $4, estado_id = $5, estado = $6 WHERE id = $7 RETURNING *",
      [
        cliente_id,
        fecha,
        total_venta,
        domiciliario_id || null,
        estado_id || null,
        estado,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    // Si hay productos, eliminar detalles viejos e insertar nuevos
    if (productos && productos.length > 0) {
      await query("DELETE FROM detalle_ventas WHERE venta_id = $1", [id]);
      for (const producto of productos) {
        await query(
          "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, subtotal) VALUES ($1, $2, $3, $4, $5)",
          [
            id,
            producto.producto_id,
            producto.cantidad,
            producto.precio_unitario,
            producto.cantidad * producto.precio_unitario,
          ],
        );
      }
    }

    res.json({
      success: true,
      message: "Venta actualizada exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const toggleEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = estadoVentaSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
        errors: error.details.map((d) => d.message),
      });
    }

    // Actualizar estado
    await query("UPDATE ventas SET estado = $1 WHERE id = $2", [
      value.estado,
      id,
    ]);

    // Obtener venta con detalles
    const result = await query(
      `
      SELECT 
        v.*,
        c.nombre as cliente_nombre,
        c.documento as cliente_documento,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion,
        d.nombre as domiciliario_nombre,
        d.documento as domiciliario_documento,
        d.telefono as domiciliario_telefono,
        dv.id as detalle_id,
        dv.producto_id as detalle_producto_id,
        dv.cantidad as detalle_cantidad,
        dv.precio_venta as detalle_precio_venta,
        dv.subtotal as detalle_subtotal,
        p.nombre as detalle_producto_nombre
      FROM ventas v
      INNER JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN domiciliarios d ON v.domiciliario_id = d.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      LEFT JOIN productos p ON dv.producto_id = p.id
      WHERE v.id = $1
      ORDER BY dv.id
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    // Construir venta con detalles anidados
    const firstRow = result.rows[0];
    const venta = { ...firstRow };
    delete venta.detalle_id;
    delete venta.detalle_producto_id;
    delete venta.detalle_cantidad;
    delete venta.detalle_precio_venta;
    delete venta.detalle_subtotal;
    delete venta.detalle_producto_nombre;

    venta.detalle_ventas = result.rows
      .filter((row) => row.detalle_id)
      .map((row) => ({
        id: row.detalle_id,
        producto_id: row.detalle_producto_id,
        producto_nombre: row.detalle_producto_nombre,
        cantidad: row.detalle_cantidad,
        precio_venta: row.detalle_precio_venta,
        subtotal: row.detalle_subtotal,
      }));

    res.json({
      success: true,
      message: `Estado de la venta actualizado a ${venta.estado}`,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

const deleteVenta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM ventas WHERE id = $1 RETURNING *", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Venta eliminada exitosamente",
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
  deleteVenta,
};
