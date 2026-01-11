const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.get('/', proveedorController.getAll);
router.get('/:id', proveedorController.getById);
router.post('/', proveedorController.create);
router.put('/:id', proveedorController.update);
router.patch('/:id/toggle-estado', proveedorController.toggleEstado);
router.delete('/:id', proveedorController.deleteProveedor);

module.exports = router;
