const express = require('express');
const controller = require('../../controllers/admin/adminUser.controller');
const validators = require('../../validators/adminUser.validator');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('users', 'view'), controller.list);
router.get('/:id', can('users', 'view'), controller.getById);
router.post('/', can('users', 'create'), validators.create, validate, controller.create);
router.put('/:id', can('users', 'edit'), validators.update, validate, controller.update);
router.post('/:id/reset-password', can('users', 'edit'), validators.resetPassword, validate, controller.resetPassword);
router.post('/:id/force-logout', can('users', 'edit'), controller.forceLogout);

module.exports = router;
