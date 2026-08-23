const express = require('express');
const { body } = require('express-validator');
const controller = require('../../controllers/admin/shipment.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'), can('orders', 'edit'));

router.get('/', controller.list);
router.get('/:sellerOrderId', controller.getShipment);
router.post('/:sellerOrderId/create', controller.createShipment);
router.get('/:sellerOrderId/couriers', controller.getCouriers);
router.post('/:sellerOrderId/awb', [body('courierId').notEmpty()], validate, controller.generateAWB);
router.post('/:sellerOrderId/pickup', controller.requestPickup);
router.get('/:sellerOrderId/label', controller.generateLabel);
router.get('/:sellerOrderId/track', controller.trackShipment);
router.post('/:sellerOrderId/cancel', controller.cancelShipment);

module.exports = router;
