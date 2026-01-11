const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

router.get('/', pedidosController.getAll);
router.get('/:id', pedidosController.getById);
router.post('/', pedidosController.create);
router.put('/:id', pedidosController.update);
router.patch('/:id/toggle-estado', pedidosController.toggleEstado);
router.delete('/:id', pedidosController.deletePedidos);

module.exports = router;
