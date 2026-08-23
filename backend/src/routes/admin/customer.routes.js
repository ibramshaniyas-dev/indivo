const express = require('express');
const controller = require('../../controllers/admin/customer.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('customers', 'view'), controller.list);
router.get('/:id', can('customers', 'view'), controller.getById);
router.post('/:id/activate', can('customers', 'edit'), controller.activate);
router.post('/:id/deactivate', can('customers', 'edit'), controller.deactivate);
router.post('/:id/block', can('customers', 'edit'), controller.block);

module.exports = router;
