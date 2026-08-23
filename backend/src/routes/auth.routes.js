const express = require('express');
const authController = require('../controllers/auth.controller');
const validators = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/register', authLimiter, validators.registerCustomer, validate, authController.registerCustomer);
router.post('/login', authLimiter, validators.login, validate, authController.login);
router.post('/refresh', authLimiter, validators.refresh, validate, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
