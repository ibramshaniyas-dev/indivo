const express = require('express');
const controller = require('../controllers/cart.controller');
const validators = require('../validators/cart.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, requireUserType } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('CUSTOMER'));

router.get('/', controller.getCart);
router.post('/items', validators.addItem, validate, controller.addItem);
router.put('/items/:itemId', validators.updateItem, validate, controller.updateItem);
router.delete('/items/:itemId', controller.removeItem);
router.delete('/', controller.clearCart);

module.exports = router;
