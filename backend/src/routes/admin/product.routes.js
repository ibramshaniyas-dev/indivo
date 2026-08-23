const express = require('express');
const controller = require('../../controllers/admin/product.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('products', 'view'), controller.list);
router.get('/:id', can('products', 'view'), controller.getById);
router.post('/:id/approve', can('products', 'approve'), controller.approve);
router.post('/:id/reject', can('products', 'approve'), controller.reject);
router.post('/:id/block', can('products', 'edit'), controller.block);
router.post('/:id/deactivate', can('products', 'edit'), controller.deactivate);
router.post('/:id/featured', can('products', 'edit'), controller.setFeatured);
router.post('/:id/bestseller', can('products', 'edit'), controller.setBestseller);
router.post('/:id/trending', can('products', 'edit'), controller.setTrending);

module.exports = router;
