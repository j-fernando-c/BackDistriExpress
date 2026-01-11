const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");

router.get("/", usuariosController.getAll);
router.get("/:id", usuariosController.getById);
router.post("/", usuariosController.create);
router.put("/:id", usuariosController.update);
router.patch("/toggle-estado/:id", usuariosController.toggleEstado);
router.delete("/:id", usuariosController.deleteUsuarios);

module.exports = router;
