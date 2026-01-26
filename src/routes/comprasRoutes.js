const express = require("express");
const router = express.Router();
const comprasController = require("../controllers/comprasController");

router.get("/", comprasController.getAll);
router.get("/:id", comprasController.getById);
router.post("/", comprasController.create);
router.put("/:id", comprasController.update);
router.patch("/:id/toggle-estado", comprasController.toggleEstado);
router.delete("/:id", comprasController.deleteCompra);

module.exports = router;
