const express = require("express");
const router = express.Router();
const domiciliariosController = require("../controllers/domiciliariosController");

router.get("/", domiciliariosController.getAll);
router.get("/:id", domiciliariosController.getById);
router.post("/", domiciliariosController.create);
router.put("/:id", domiciliariosController.update);
router.patch("/:id/estado", domiciliariosController.updateEstado);
router.delete("/:id", domiciliariosController.remove);

module.exports = router;
