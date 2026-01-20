const express = require('express');
const router = express.Router();
const detallePedidosController = require('../controllers/detalle_pedidosController');

router.get('/', detallePedidosController.getAll);
router.get('/:id', detallePedidosController.getById);
router.get('/pedido/:pedido_id', detallePedidosController.getByPedidoId);
router.post('/', detallePedidosController.create);
router.put('/:id', detallePedidosController.update);
router.delete('/:id', detallePedidosController.deleteDetallePedido);

module.exports = router;
