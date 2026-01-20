const express = require('express');
const router = express.Router();
const domiciliariosController = require('../controllers/domiciliariosController');

router.get('/', domiciliariosController.getAll);
router.get('/:id', domiciliariosController.getById);
router.post('/', domiciliariosController.create);
router.put('/:id', domiciliariosController.update);
router.patch('/:id/toggle-estado', domiciliariosController.toggleEstado);
router.delete('/:id', domiciliariosController.deleteDomiciliario);

module.exports = router;
