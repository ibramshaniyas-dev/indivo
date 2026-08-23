const express = require('express');
const controller = require('../../controllers/admin/order.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('orders', 'view'), controller.list);
router.get('/:id', can('orders', 'view'), controller.getById);

module.exports = router;
