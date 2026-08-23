const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/wishlist.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, requireUserType } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate, requireUserType('CUSTOMER'));

router.get('/', controller.list);
router.post('/', [body('productId').isInt()], validate, controller.add);
router.delete('/:productId', [param('productId').isInt()], validate, controller.remove);

module.exports = router;
