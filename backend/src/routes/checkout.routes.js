const express = require('express');
const controller = require('../controllers/checkout.controller');
const validators = require('../validators/checkout.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, requireUserType } = require('../middleware/auth.middleware');
const { checkoutLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('CUSTOMER'));

router.post('/', checkoutLimiter, validators.placeOrder, validate, controller.checkout);

module.exports = router;
