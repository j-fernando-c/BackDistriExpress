const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.get('/', productoController.getAll);
router.get('/:id', productoController.getById);
router.post('/', productoController.create);
router.put('/:id', productoController.update);
router.patch('/:id/toggle-estado', productoController.toggleEstado);
router.delete('/:id', productoController.deleteProducto);

module.exports = router;
