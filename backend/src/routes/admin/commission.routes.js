const express = require('express');
const controller = require('../../controllers/commission.controller');
const { authenticate, requireUserType, can } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('ADMIN'));

router.get('/', can('commission', 'view'), controller.overview);
router.get('/ledger', can('commission', 'view'), controller.adminLedger);
router.put('/global', can('commission', 'edit'), controller.updateGlobal);
router.put('/sellers/:sellerId', can('commission', 'edit'), controller.updateSeller);
router.delete('/sellers/:sellerId', can('commission', 'edit'), controller.resetSeller);

module.exports = router;
