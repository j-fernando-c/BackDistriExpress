const Joi = require("joi");
const { query } = require("../config/database");

const abonoSchema = Joi.object({
  venta_id: Joi.string().uuid().required(),
  monto: Joi.number().precision(2).positive().required(),
  metodo_pago: Joi.string().required().min(2).max(100),
  referencia_pago: Joi.string().allow("").max(100),
  descripcion: Joi.string().allow("").max(500),
  usuario_id: Joi.string().uuid().allow(""),
});

const validateAbono = (data) =>
  abonoSchema.validate(data, { abortEarly: false });

/**
 * Obtener todos los abonos
 */
const getAll = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM abonos ORDER BY fecha DESC");
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un abono por ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM abonos WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Abono no encontrado",
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

/**
 * Obtener todos los abonos de una venta específica
 */
const getByVentaId = async (req, res, next) => {
  try {
    const { ventaId } = req.params;
    const result = await query(
      "SELECT * FROM abonos WHERE venta_id = $1 ORDER BY fecha DESC",
      [ventaId],
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

/**
 * Obtener el total de abonos de una venta
 */
const getTotalAbonos = async (req, res, next) => {
  try {
    const { ventaId } = req.params;
    const result = await query(
      "SELECT COALESCE(SUM(monto), 0) as total_abonos FROM abonos WHERE venta_id = $1",
      [ventaId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    res.json({
      success: true,
      data: {
        total_abonos: parseFloat(result.rows[0].total_abonos),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo abono
 */
const create = async (req, res, next) => {
  try {
    const { error, value } = validateAbono(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    const {
      venta_id,
      monto,
      metodo_pago,
      referencia_pago,
      descripcion,
      usuario_id,
    } = value;

    // Verificar que la venta existe
    const ventaCheck = await query("SELECT * FROM ventas WHERE id = $1", [
      venta_id,
    ]);
    if (ventaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    const venta = ventaCheck.rows[0];

    // Obtener total de abonos actuales
    const abonosprevios = await query(
      "SELECT COALESCE(SUM(monto), 0) as total_abonos FROM abonos WHERE venta_id = $1",
      [venta_id],
    );
    const totalAbonos = parseFloat(abonosprevios.rows[0].total_abonos);
    const nuevaDeuda = venta.total_venta - totalAbonos;

    // Validar que el abono no sea mayor a la deuda
    if (monto > nuevaDeuda) {
      return res.status(400).json({
        success: false,
        message: `El monto del abono (${monto}) no puede ser mayor a la deuda actual (${nuevaDeuda})`,
      });
    }

    const result = await query(
      "INSERT INTO abonos (venta_id, monto, metodo_pago, referencia_pago, descripcion, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        venta_id,
        monto,
        metodo_pago,
        referencia_pago || null,
        descripcion || null,
        usuario_id || null,
      ],
    );

    // Calcular nuevo estado de la venta basado en los abonos
    const nuevoTotal = totalAbonos + monto;
    let nuevoEstado = venta.estado;

    if (nuevoTotal >= venta.total_venta) {
      nuevoEstado = "pagada";
    } else if (nuevoTotal > 0) {
      nuevoEstado = "pagada"; // O puedes crear un estado 'parcialmente_pagada'
    }

    // Actualizar el estado de la venta si fue completamente pagada
    if (nuevoTotal >= venta.total_venta) {
      await query("UPDATE ventas SET estado = $1 WHERE id = $2", [
        "pagada",
        venta_id,
      ]);
    }

    res.status(201).json({
      success: true,
      message: "Abono registrado exitosamente",
      data: result.rows[0],
      ventaResumen: {
        total_venta: venta.total_venta,
        total_abonos: nuevoTotal,
        deuda_restante: venta.total_venta - nuevoTotal,
        estado_venta: nuevoTotal >= venta.total_venta ? "pagada" : venta.estado,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un abono
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateAbono(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.details.map((d) => d.message),
      });
    }

    // Obtener el abono actual
    const abonoActual = await query("SELECT * FROM abonos WHERE id = $1", [id]);
    if (abonoActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Abono no encontrado",
      });
    }

    const {
      venta_id,
      monto,
      metodo_pago,
      referencia_pago,
      descripcion,
      usuario_id,
    } = value;
    const ventaId = venta_id || abonoActual.rows[0].venta_id;
    const montoNuevo = monto || abonoActual.rows[0].monto;
    const montoDiferencia = montoNuevo - abonoActual.rows[0].monto;

    // Verificar que la venta existe
    const ventaCheck = await query("SELECT * FROM ventas WHERE id = $1", [
      ventaId,
    ]);
    if (ventaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    const venta = ventaCheck.rows[0];

    // Obtener total de abonos sin este abono
    const abonosprevios = await query(
      "SELECT COALESCE(SUM(monto), 0) as total_abonos FROM abonos WHERE venta_id = $1 AND id != $2",
      [ventaId, id],
    );
    const totalAbonos = parseFloat(abonosprevios.rows[0].total_abonos);

    // Validar que el nuevo monto no sea mayor a la deuda
    if (montoNuevo > venta.total_venta - totalAbonos) {
      return res.status(400).json({
        success: false,
        message: `El monto del abono no puede ser mayor a la deuda actual`,
      });
    }

    const result = await query(
      "UPDATE abonos SET venta_id = $1, monto = $2, metodo_pago = $3, referencia_pago = $4, descripcion = $5, usuario_id = $6 WHERE id = $7 RETURNING *",
      [
        ventaId,
        montoNuevo,
        metodo_pago,
        referencia_pago || null,
        descripcion || null,
        usuario_id || null,
        id,
      ],
    );

    // Recalcular estado de la venta
    const nuevoTotal = totalAbonos + montoNuevo;
    if (nuevoTotal >= venta.total_venta) {
      await query("UPDATE ventas SET estado = $1 WHERE id = $2", [
        "pagada",
        ventaId,
      ]);
    }

    res.json({
      success: true,
      message: "Abono actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un abono
 */
const deleteAbono = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener el abono
    const abonoCheck = await query("SELECT * FROM abonos WHERE id = $1", [id]);
    if (abonoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Abono no encontrado",
      });
    }

    const abono = abonoCheck.rows[0];
    const ventaId = abono.venta_id;

    // Eliminar el abono
    const result = await query("DELETE FROM abonos WHERE id = $1 RETURNING *", [
      id,
    ]);

    // Recalcular estado de la venta
    const venta = await query("SELECT * FROM ventas WHERE id = $1", [ventaId]);
    if (venta.rows.length > 0) {
      const ventaData = venta.rows[0];
      const abonosprevios = await query(
        "SELECT COALESCE(SUM(monto), 0) as total_abonos FROM abonos WHERE venta_id = $1",
        [ventaId],
      );
      const totalAbonos = parseFloat(abonosprevios.rows[0].total_abonos);

      // Actualizar el estado de la venta
      let nuevoEstado = "pendiente";
      if (totalAbonos > 0 && totalAbonos < ventaData.total_venta) {
        nuevoEstado = "pendiente";
      } else if (totalAbonos >= ventaData.total_venta) {
        nuevoEstado = "pagada";
      }

      await query("UPDATE ventas SET estado = $1 WHERE id = $2", [
        nuevoEstado,
        ventaId,
      ]);
    }

    res.json({
      success: true,
      message: "Abono eliminado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener resumen de pagos de una venta
 */
const getResumenPagos = async (req, res, next) => {
  try {
    const { ventaId } = req.params;

    // Verificar que la venta existe
    const ventaCheck = await query("SELECT * FROM ventas WHERE id = $1", [
      ventaId,
    ]);
    if (ventaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    const venta = ventaCheck.rows[0];

    // Obtener todos los abonos
    const abonos = await query(
      "SELECT * FROM abonos WHERE venta_id = $1 ORDER BY fecha ASC",
      [ventaId],
    );

    const totalAbonos = abonos.rows.reduce(
      (sum, abono) => sum + parseFloat(abono.monto),
      0,
    );
    const deudaRestante = venta.total_venta - totalAbonos;

    res.json({
      success: true,
      data: {
        venta: {
          id: venta.id,
          cliente_id: venta.cliente_id,
          total_venta: parseFloat(venta.total_venta),
          estado: venta.estado,
          fecha: venta.fecha,
        },
        resumen: {
          total_venta: parseFloat(venta.total_venta),
          total_abonos: totalAbonos,
          deuda_restante: deudaRestante,
          porcentaje_pagado: ((totalAbonos / venta.total_venta) * 100).toFixed(
            2,
          ),
          cantidad_abonos: abonos.rows.length,
        },
        abonos: abonos.rows.map((a) => ({
          id: a.id,
          monto: parseFloat(a.monto),
          fecha: a.fecha,
          metodo_pago: a.metodo_pago,
          referencia_pago: a.referencia_pago,
          descripcion: a.descripcion,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByVentaId,
  getTotalAbonos,
  create,
  update,
  deleteAbono,
  getResumenPagos,
};
