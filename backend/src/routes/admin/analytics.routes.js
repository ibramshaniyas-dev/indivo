const express = require('express');
const controller = require('../../controllers/analytics.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('reports', 'view'), controller.platformDashboard);

module.exports = router;
