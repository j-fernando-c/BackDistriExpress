const express = require('express');
const router = express.Router();
const zonasController = require('../controllers/zonasController');

router.get('/', zonasController.getAll);
router.get('/:id', zonasController.getById);
router.post('/', zonasController.create);
router.put('/:id', zonasController.update);
router.delete('/:id', zonasController.deleteZonas);

module.exports = router;
