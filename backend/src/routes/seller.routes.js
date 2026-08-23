const express = require('express');
const controller = require('../controllers/seller.controller');
const validators = require('../validators/seller.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, sellerScope } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { uploadSellerDocument } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/register', authLimiter, validators.register, validate, controller.register);

router.get('/me', authenticate, sellerScope, controller.getMe);
router.put('/business', authenticate, sellerScope, validators.business, validate, controller.updateBusiness);
router.put('/bank', authenticate, sellerScope, validators.bank, validate, controller.updateBank);
router.post('/agreement', authenticate, sellerScope, controller.acceptAgreement);
router.post('/submit', authenticate, sellerScope, controller.submit);

router.post(
  '/documents',
  authenticate,
  sellerScope,
  uploadSellerDocument.single('document'),
  validators.documentUpload,
  validate,
  controller.uploadDocument
);
router.delete('/documents/:docId', authenticate, sellerScope, controller.removeDocument);

module.exports = router;
