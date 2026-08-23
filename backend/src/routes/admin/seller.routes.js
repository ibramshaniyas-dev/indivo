const express = require('express');
const controller = require('../../controllers/admin/seller.controller');
const validators = require('../../validators/seller.validator');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('sellers', 'view'), controller.list);
router.get('/:id', can('sellers', 'view'), controller.getById);
router.post('/:id/approve', can('sellers', 'approve'), controller.approve);
router.post('/:id/reject', can('sellers', 'approve'), validators.reject, validate, controller.reject);
router.post('/:id/suspend', can('sellers', 'approve'), controller.suspend);
router.post('/:id/block', can('sellers', 'approve'), controller.block);
router.post('/:id/activate', can('sellers', 'approve'), controller.activate);
router.post(
  '/:id/documents/:docId/verify',
  can('seller_documents', 'approve'),
  validators.verifyDocument,
  validate,
  controller.verifyDocument
);

module.exports = router;
