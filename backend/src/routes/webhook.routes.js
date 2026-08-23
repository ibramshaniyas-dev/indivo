const express = require('express');
const controller = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middleware/rateLimit.middleware');

// Public routes — Razorpay/Shiprocket call these directly, so there's no session to authenticate.
// Each handler verifies its own signature/token before touching the database.
const router = express.Router();

router.post('/razorpay', webhookLimiter, controller.razorpayWebhook);
router.post('/shiprocket', webhookLimiter, controller.shiprocketWebhook);

module.exports = router;
