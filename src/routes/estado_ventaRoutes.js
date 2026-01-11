const express = require('express');
const router = express.Router();
const estado_ventaController = require('../controllers/estado_ventaController');

router.get('/', estado_ventaController.getAll);
router.get('/:id', estado_ventaController.getById);
router.post('/', estado_ventaController.create);
router.put('/:id', estado_ventaController.update);
router.delete('/:id', estado_ventaController.deleteEstado_venta);

module.exports = router;
