const express = require('express');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const brandRoutes = require('./brand.routes');
const attributeRoutes = require('./attribute.routes');
const sellerRoutes = require('./seller.routes');
const adminSellerRoutes = require('./admin/seller.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/attributes', attributeRoutes);
router.use('/sellers', sellerRoutes);
router.use('/admin/sellers', adminSellerRoutes);

// Phase 1 (remaining): customers, products, cart, wishlist, checkout, orders,
// payments, admin dashboard — mounted here as each ships.

module.exports = router;
