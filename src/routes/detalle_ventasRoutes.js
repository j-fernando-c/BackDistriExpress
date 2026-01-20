const express = require('express');
const router = express.Router();
const detalleVentasController = require('../controllers/detalle_ventasController');

router.get('/', detalleVentasController.getAll);
router.get('/:id', detalleVentasController.getById);
router.get('/venta/:venta_id', detalleVentasController.getByVentaId);
router.post('/', detalleVentasController.create);
router.put('/:id', detalleVentasController.update);
router.delete('/:id', detalleVentasController.deleteDetalleVenta);

module.exports = router;
