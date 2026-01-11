const express = require('express');
const router = express.Router();
const detalle_compraController = require('../controllers/detalle_compraController');

router.get('/', detalle_compraController.getAll);
router.get('/:id', detalle_compraController.getById);
router.post('/', detalle_compraController.create);
router.put('/:id', detalle_compraController.update);
router.delete('/:id', detalle_compraController.deleteDetalle_compra);

module.exports = router;
