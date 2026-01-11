const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.getAll);
router.get('/:id', clienteController.getById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.patch('/:id/toggle-estado', clienteController.toggleEstado);
router.delete('/:id', clienteController.deleteCliente);

module.exports = router;
