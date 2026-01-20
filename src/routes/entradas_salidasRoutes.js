const express = require('express');
const router = express.Router();
const entradasSalidasController = require('../controllers/entradas_salidasController');

router.get('/', entradasSalidasController.getAll);
router.get('/:id', entradasSalidasController.getById);
router.post('/', entradasSalidasController.create);
router.put('/:id', entradasSalidasController.update);
router.patch('/:id/toggle-estado', entradasSalidasController.toggleEstado);
router.delete('/:id', entradasSalidasController.deleteEntradaSalida);

module.exports = router;
