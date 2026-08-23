const express = require('express');
const controller = require('../../controllers/admin/role.controller');
const validators = require('../../validators/role.validator');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/permissions', can('roles', 'view'), controller.listPermissions);
router.get('/', can('roles', 'view'), controller.list);
router.get('/:id', can('roles', 'view'), controller.getById);
router.post('/', can('roles', 'create'), validators.create, validate, controller.create);
router.put('/:id', can('roles', 'edit'), validators.update, validate, controller.update);
router.post('/:id/clone', can('roles', 'create'), controller.clone);
router.delete('/:id', can('roles', 'delete'), controller.remove);

module.exports = router;
