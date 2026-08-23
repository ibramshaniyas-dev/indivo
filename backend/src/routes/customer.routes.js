const express = require('express');
const addressController = require('../controllers/customerAddress.controller');
const addressValidators = require('../validators/customerAddress.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, requireUserType } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('CUSTOMER'));

router.get('/me/addresses', addressController.list);
router.post('/me/addresses', addressValidators.upsert, validate, addressController.create);
router.delete('/me/addresses/:id', addressController.remove);
router.post('/me/addresses/:id/default', addressController.setDefault);

module.exports = router;
