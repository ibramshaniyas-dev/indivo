const express = require('express');
const controller = require('../controllers/seller.controller');
const productController = require('../controllers/product.controller');
const sellerOrderController = require('../controllers/sellerOrder.controller');
const validators = require('../validators/seller.validator');
const productValidators = require('../validators/product.validator');
const sellerOrderValidators = require('../validators/sellerOrder.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, sellerScope, requireApprovedSeller } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { uploadSellerDocument, uploadProductMedia } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/register', authLimiter, validators.register, validate, controller.register);
router.get('/:id/store', controller.getStore);

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

const productRouter = express.Router();
productRouter.use(authenticate, sellerScope, requireApprovedSeller);
productRouter.get('/', productController.listMine);
productRouter.post('/', productValidators.create, validate, productController.create);
productRouter.get('/:id', productValidators.idParam, validate, productController.getMineById);
productRouter.put('/:id', productValidators.update, validate, productController.update);
productRouter.post('/:id/variants', productValidators.idParam, productValidators.addVariant, validate, productController.addVariant);
productRouter.post('/:id/images', productValidators.idParam, validate, uploadProductMedia.array('images', 8), productController.uploadImages);
productRouter.post('/:id/submit', productValidators.idParam, validate, productController.submitForReview);
router.use('/products', productRouter);

const orderRouter = express.Router();
orderRouter.use(authenticate, sellerScope, requireApprovedSeller);
orderRouter.get('/', sellerOrderController.listMine);
orderRouter.get('/:id', sellerOrderController.getMineById);
orderRouter.post('/:id/status', sellerOrderValidators.updateStatus, validate, sellerOrderController.updateStatus);
router.use('/orders', orderRouter);

module.exports = router;
