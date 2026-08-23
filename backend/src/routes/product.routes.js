const express = require('express');
const controller = require('../controllers/product.controller');
const validators = require('../validators/product.validator');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.get('/', validators.list, validate, controller.list);
router.get('/:slug', controller.getBySlug);

module.exports = router;
