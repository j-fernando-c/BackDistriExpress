const express = require("express");
const router = express.Router();
const entradas_salidasController = require("../controllers/entradas_salidasController");

router.get("/", entradas_salidasController.getAll);
router.get("/:id", entradas_salidasController.getById);
router.post("/", entradas_salidasController.create);
router.put("/:id", entradas_salidasController.update);
router.patch("/:id/estado", entradas_salidasController.toggleEstado);
router.delete("/:id", entradas_salidasController.deleteEntradaSalida);

module.exports = router;
