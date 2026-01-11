const express = require('express');
const router = express.Router();
const cronogramasController = require('../controllers/cronogramasController');

router.get('/', cronogramasController.getAll);
router.get('/:id', cronogramasController.getById);
router.post('/', cronogramasController.create);
router.put('/:id', cronogramasController.update);
router.patch('/:id/toggle-estado', cronogramasController.toggleEstado);
router.delete('/:id', cronogramasController.deleteCronogramas);

module.exports = router;
