const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.get('/', compraController.getAll);
router.get('/:id', compraController.getById);
router.post('/', compraController.create);
router.put('/:id', compraController.update);
router.patch('/:id/toggle-estado', compraController.toggleEstado);
router.delete('/:id', compraController.deleteCompra);

module.exports = router;
