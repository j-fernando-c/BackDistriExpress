const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

router.get('/', rolesController.getAll);
router.get('/:id', rolesController.getById);
router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.patch('/:id/toggle-estado', rolesController.toggleEstado);
router.delete('/:id', rolesController.deleteRoles);

module.exports = router;
