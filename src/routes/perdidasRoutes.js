const express = require('express');
const router = express.Router();
const perdidasController = require('../controllers/perdidasController');

router.get('/', perdidasController.getAll);
router.get('/:id', perdidasController.getById);
router.post('/', perdidasController.create);
router.put('/:id', perdidasController.update);
router.delete('/:id', perdidasController.deletePerdida);

module.exports = router;
