const express = require('express');
const controller = require('../controllers/attribute.controller');
const validators = require('../validators/attribute.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, can } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', controller.list);
router.post('/', authenticate, can('attributes', 'create'), validators.create, validate, controller.create);
router.delete('/:id', authenticate, can('attributes', 'delete'), validators.idParam, validate, controller.remove);
router.post('/:id/values', authenticate, can('attributes', 'edit'), validators.idParam, validators.addValue, validate, controller.addValue);
router.delete('/:id/values/:valueId', authenticate, can('attributes', 'edit'), validators.idParam, validate, controller.removeValue);

module.exports = router;
