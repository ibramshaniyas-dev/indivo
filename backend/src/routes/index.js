const express = require('express');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const brandRoutes = require('./brand.routes');
const attributeRoutes = require('./attribute.routes');
const sellerRoutes = require('./seller.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const wishlistRoutes = require('./wishlist.routes');
const cmsRoutes = require('./cms.routes');
const checkoutRoutes = require('./checkout.routes');
const orderRoutes = require('./order.routes');
const customerRoutes = require('./customer.routes');
const adminSellerRoutes = require('./admin/seller.routes');
const adminProductRoutes = require('./admin/product.routes');
const adminUserRoutes = require('./admin/adminUser.routes');
const adminRoleRoutes = require('./admin/role.routes');
const adminCustomerRoutes = require('./admin/customer.routes');
const adminOrderRoutes = require('./admin/order.routes');
const adminShipmentRoutes = require('./admin/shipment.routes');
const webhookRoutes = require('./webhook.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/attributes', attributeRoutes);
router.use('/sellers', sellerRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cms', cmsRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/admin/sellers', adminSellerRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin/roles', adminRoleRoutes);
router.use('/admin/customers', adminCustomerRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/shipments', adminShipmentRoutes);
router.use('/webhooks', webhookRoutes);

// Phase 1 (remaining): payments gateway integration (customer-facing create/verify), returns/refunds.

module.exports = router;
