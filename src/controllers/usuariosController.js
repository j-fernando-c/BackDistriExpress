const Joi = require("joi");
const { query } = require("../config/database");

const usuariosSchema = Joi.object({
  nombre: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  rol_id: Joi.string().required(),
  contrasena: Joi.string().required().min(6),
});

const validateUsuarios = (data) =>
  usuariosSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM usuarios ORDER BY id DESC");
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
    const result = await query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
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
    const { error, value } = validateUsuarios(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nombre, email, rol_id, contrasena } = value;

    const result = await query(
      "INSERT INTO usuarios (nombre, email, rol_id, contrasena, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, email, rol_id, contrasena, "Activo"]
    );

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateUsuarios(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nombre, email, rol_id, contrasena } = value;

    const result = await query(
      "UPDATE usuarios SET nombre = $1, email = $2, rol_id = $3, contrasena = $4 WHERE id = $5 RETURNING *",
      [nombre, email, rol_id, contrasena, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
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
      "UPDATE usuarios SET estado = CASE WHEN estado = $1 THEN $2 ELSE $1 END WHERE id = $3 RETURNING *",
      ["Activo", "Inactivo", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: `Usuario ${
        result.rows[0].estado === "Activo" ? "activado" : "desactivado"
      } exitosamente`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteUsuarios = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM usuarios WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
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
  deleteUsuarios,
};
