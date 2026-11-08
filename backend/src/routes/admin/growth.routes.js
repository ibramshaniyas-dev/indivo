const express = require('express');
const controller = require('../../controllers/growth.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

// Payouts (settlements), seller performance scorecards and platform insights.
const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/settlements/due', can('settlements', 'view'), controller.payoutsDue);
router.get('/settlements', can('settlements', 'view'), controller.settlementHistory);
router.post('/settlements/:sellerId/pay', can('settlements', 'approve'), controller.recordPayout);

router.get('/performance', can('sellers', 'view'), controller.sellerPerformance);
router.get('/insights', can('reports', 'view'), controller.adminInsights);
router.get('/search-insights', can('reports', 'view'), controller.searchInsights);

module.exports = router;
