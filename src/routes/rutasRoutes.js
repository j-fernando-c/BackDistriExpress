const express = require('express');
const router = express.Router();
const rutasController = require('../controllers/rutasController');

router.get('/', rutasController.getAll);
router.get('/:id', rutasController.getById);
router.post('/', rutasController.create);
router.put('/:id', rutasController.update);
router.patch('/:id/toggle-estado', rutasController.toggleEstado);
router.delete('/:id', rutasController.deleteRutas);

module.exports = router;
