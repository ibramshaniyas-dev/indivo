const express = require('express');
const controller = require('../controllers/payment.controller');
const validators = require('../validators/payment.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, requireUserType } = require('../middleware/auth.middleware');
const { checkoutLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Public — lets Checkout.jsx know whether to offer the ONLINE option at all before a customer
// picks it and hits a "not configured" error. keyId is meant to be public (identifies the
// account, not a secret); the key secret never leaves the backend.
router.get('/config', controller.getConfig);

router.use(authenticate, requireUserType('CUSTOMER'));

router.post('/create', checkoutLimiter, validators.createPayment, validate, controller.createPayment);
router.post('/verify', checkoutLimiter, validators.verifyPayment, validate, controller.verifyPayment);

module.exports = router;
