const express = require('express');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const brandRoutes = require('./brand.routes');
const attributeRoutes = require('./attribute.routes');
const sellerRoutes = require('./seller.routes');
const productRoutes = require('./product.routes');
const adminSellerRoutes = require('./admin/seller.routes');
const adminProductRoutes = require('./admin/product.routes');
const adminUserRoutes = require('./admin/adminUser.routes');
const adminRoleRoutes = require('./admin/role.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/attributes', attributeRoutes);
router.use('/sellers', sellerRoutes);
router.use('/products', productRoutes);
router.use('/admin/sellers', adminSellerRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin/roles', adminRoleRoutes);

// Phase 1 (remaining): customers, cart, wishlist, checkout, orders,
// payments, admin dashboard — mounted here as each ships.

module.exports = router;
