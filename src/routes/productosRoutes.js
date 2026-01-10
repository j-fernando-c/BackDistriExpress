const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

router.get('/', productosController.getAll);
router.get('/:id', productosController.getById);
router.post('/', productosController.create);
router.put('/:id', productosController.update);
router.patch('/:id/toggle-estado', productosController.toggleEstado);
router.delete('/:id', productosController.deleteProducto);

module.exports = router;
