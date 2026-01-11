const express = require('express');
const router = express.Router();
const detalle_permisoController = require('../controllers/detalle_permisoController');

router.get('/', detalle_permisoController.getAll);
router.get('/:id', detalle_permisoController.getById);
router.post('/', detalle_permisoController.create);
router.put('/:id', detalle_permisoController.update);
router.delete('/:id', detalle_permisoController.deleteDetalle_permiso);

module.exports = router;
