const Joi = require("joi");
const { query } = require("../config/database");

const proveedorSchema = Joi.object({
  nombre: Joi.string().required().min(2).max(100),
  tipo: Joi.string().allow("").max(50),
  documento: Joi.string().required().min(5).max(30),
  contacto: Joi.string().allow("").max(100),
  email: Joi.string().email().allow(""),
  telefono: Joi.string().allow("").max(20),
});

const validateProveedor = (data) =>
  proveedorSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM proveedores ORDER BY id DESC");
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
    const result = await query("SELECT * FROM proveedores WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
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
    const { error, value } = validateProveedor(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nombre, tipo, documento, contacto, email, telefono } = value;

    const result = await query(
      `INSERT INTO proveedores (nombre, tipo, documento, contacto, email, telefono, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        nombre,
        tipo || null,
        documento,
        contacto || null,
        email || null,
        telefono || null,
        "Activo",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Proveedor creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateProveedor(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nombre, tipo, documento, contacto, email, telefono } = value;

    const result = await query(
      `UPDATE proveedores SET nombre = $1, tipo = $2, documento = $3, contacto = $4, 
       email = $5, telefono = $6 WHERE id = $7 RETURNING *`,
      [
        nombre,
        tipo || null,
        documento,
        contacto || null,
        email || null,
        telefono || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Proveedor actualizado exitosamente",
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
      "UPDATE proveedores SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *",
      ["Activo", "Inactivo", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "proveedores no encontrado",
      });
    }

    res.json({
      success: true,
      message: `Proveedor ${
        result.rows[0].estado === "Activo" ? "activado" : "desactivado"
      } exitosamente`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteProveedor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM provedores WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Proveedor eliminado exitosamente",
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
  deleteProveedor,
};
