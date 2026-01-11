const Joi = require("joi");
const { query } = require("../config/database");

const productoSchema = Joi.object({
  nombre: Joi.string().required().min(2).max(100),
  categoria_nombre: Joi.string(),
  categoria_id: Joi.string().required(),
  descripcion: Joi.string().allow("").max(500),
  precio: Joi.number().precision(2).positive().required(),
  cantidad: Joi.number().integer().min(0).required(),
  stock_min: Joi.number().integer().min(0).required(),
  stock_max: Joi.number().integer().min(0).required(),
});

const validateProducto = (data) =>
  productoSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, cp.nombre_categoria as categoria_nombre 
       FROM productos p 
       LEFT JOIN categoria_productos cp ON p.categoria_id = cp.id 
       ORDER BY p.id DESC`
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
      `SELECT p.*, cp.nombre_categoria as categoria_nombre
       FROM productos p
       LEFT JOIN categoria_productos cp ON p.categoria_id = cp.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
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
    const { error, value } = validateProducto(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const {
      nombre,
      categoria_id,
      descripcion,
      precio,
      cantidad,
      stock_min,
      stock_max,
    } = value;

    const insertResult = await query(
      `INSERT INTO productos (nombre, categoria_id, descripcion, precio, cantidad, stock_min, stock_max, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        nombre,
        categoria_id,
        descripcion || null,
        precio,
        cantidad,
        stock_min,
        stock_max,
        "Activo",
      ]
    );

    const newId = insertResult.rows[0].id;

    const result = await query(
      `SELECT p.*, cp.nombre_categoria as categoria_nombre
       FROM productos p
       LEFT JOIN categoria_productos cp ON p.categoria_id = cp.id
       WHERE p.id = $1`,
      [newId]
    );

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateProducto(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const {
      nombre,
      categoria_id,
      descripcion,
      precio,
      cantidad,
      stock_min,
      stock_max,
    } = value;

    const updateResult = await query(
      `UPDATE productos SET nombre = $1, categoria_id = $2, descripcion = $3, precio = $4, 
       cantidad = $5, stock_min = $6, stock_max = $7 WHERE id = $8 RETURNING *`,
      [
        nombre,
        categoria_id,
        descripcion || null,
        precio,
        cantidad,
        stock_min,
        stock_max,
        id,
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    const result = await query(
      `SELECT p.*, cp.nombre_categoria as categoria_nombre
       FROM productos p
       LEFT JOIN categoria_productos cp ON p.categoria_id = cp.id
       WHERE p.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
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
      "UPDATE productos SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *",
      ["Activo", "Inactivo", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      message: `Producto ${
        result.rows[0].estado === "Activo" ? "activado" : "desactivado"
      } exitosamente`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM productos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
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
  deleteProducto,
};
