const express = require('express');
const controller = require('../controllers/brand.controller');
const validators = require('../validators/brand.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, can } = require('../middleware/auth.middleware');
const { uploadBrandLogo } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', validators.idParam, validate, controller.getById);

router.post('/', authenticate, can('brands', 'create'), uploadBrandLogo.single('logo'), validators.create, validate, controller.create);
router.put('/:id', authenticate, can('brands', 'edit'), uploadBrandLogo.single('logo'), validators.update, validate, controller.update);
router.delete('/:id', authenticate, can('brands', 'delete'), validators.idParam, validate, controller.remove);

module.exports = router;
