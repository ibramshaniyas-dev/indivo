const express = require('express');
const controller = require('../controllers/order.controller');
const { authenticate, requireUserType } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('CUSTOMER'));

router.get('/', controller.listMyOrders);
router.get('/:id', controller.getMyOrder);

module.exports = router;
