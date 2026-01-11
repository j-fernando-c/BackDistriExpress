const express = require('express');
const router = express.Router();
const categoria_productosController = require('../controllers/categoria_productosController');

router.get('/', categoria_productosController.getAll);
router.get('/:id', categoria_productosController.getById);
router.post('/', categoria_productosController.create);
router.put('/:id', categoria_productosController.update);
router.patch('/:id/toggle-estado', categoria_productosController.toggleEstado);
router.delete('/:id', categoria_productosController.deleteCategoria_productos);

module.exports = router;
