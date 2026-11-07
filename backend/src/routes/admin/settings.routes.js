const express = require('express');
const controller = require('../../controllers/admin/settings.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

// Platform settings & integration credentials — the `settings` module is SUPER_ADMIN-only (see seed/permissions.js).
const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('settings', 'view'), controller.list);
router.put('/', can('settings', 'edit'), controller.update);
router.post('/test/:integration', can('settings', 'edit'), controller.testIntegration);

module.exports = router;
