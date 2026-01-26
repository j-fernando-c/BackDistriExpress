const express = require("express");
const router = express.Router();
const abonosController = require("../controllers/abonosController");

// Rutas CRUD básicas
router.get("/", abonosController.getAll);
router.get("/:id", abonosController.getById);
router.post("/", abonosController.create);
router.put("/:id", abonosController.update);
router.delete("/:id", abonosController.deleteAbono);

// Rutas específicas para abonos de una venta
router.get("/venta/:ventaId/abonos", abonosController.getByVentaId);
router.get("/venta/:ventaId/total", abonosController.getTotalAbonos);
router.get("/venta/:ventaId/resumen", abonosController.getResumenPagos);

module.exports = router;
