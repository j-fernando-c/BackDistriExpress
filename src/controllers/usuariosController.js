const Joi = require("joi");
const { query } = require("../config/database");

const usuariosSchema = Joi.object({
  tipo_documento: Joi.string().optional().max(50),
  documento: Joi.string().optional().max(20),
  nombre: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  telefono: Joi.string().optional().max(20),
  direccion: Joi.string().optional().max(255),
  rol_id: Joi.string().required(),
  contrasena: Joi.string().required().min(6),
  estado: Joi.string().optional().valid("activo", "inactivo").default("activo"),
});

const validateUsuarios = (data) =>
  usuariosSchema.validate(data, { abortEarly: false });

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*, r.nombre_rol as rol_nombre 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.id 
       ORDER BY u.fecha_creacion DESC`,
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
      `SELECT u.*, r.nombre_rol as rol_nombre 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = $1`,
      [id],
    );

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

    const {
      tipo_documento,
      documento,
      nombre,
      email,
      telefono,
      direccion,
      rol_id,
      contrasena,
      estado,
    } = value;

    const result = await query(
      "INSERT INTO usuarios (tipo_documento, documento, nombre, email, telefono, direccion, rol_id, contrasena, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        tipo_documento || null,
        documento || null,
        nombre,
        email,
        telefono || null,
        direccion || null,
        rol_id,
        contrasena,
        estado,
      ],
    );

    // Obtener el nombre del rol
    const usuarioConRol = await query(
      `SELECT u.*, r.nombre_rol as rol_nombre 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: usuarioConRol.rows[0],
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

    const {
      tipo_documento,
      documento,
      nombre,
      email,
      telefono,
      direccion,
      rol_id,
      contrasena,
      estado,
    } = value;

    const result = await query(
      "UPDATE usuarios SET tipo_documento = $1, documento = $2, nombre = $3, email = $4, telefono = $5, direccion = $6, rol_id = $7, contrasena = $8, estado = $9 WHERE id = $10 RETURNING *",
      [
        tipo_documento || null,
        documento || null,
        nombre,
        email,
        telefono || null,
        direccion || null,
        rol_id,
        contrasena,
        estado,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Obtener el nombre del rol
    const usuarioConRol = await query(
      `SELECT u.*, r.nombre_rol as rol_nombre 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: usuarioConRol.rows[0],
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
      ["Activo", "Inactivo", id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Obtener el nombre del rol
    const usuarioConRol = await query(
      `SELECT u.*, r.nombre_rol as rol_nombre 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = $1`,
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: `Usuario ${
        usuarioConRol.rows[0].estado === "Activo" ? "activado" : "desactivado"
      } exitosamente`,
      data: usuarioConRol.rows[0],
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
      [id],
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
