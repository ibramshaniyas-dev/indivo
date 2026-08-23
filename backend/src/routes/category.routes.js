const express = require('express');
const controller = require('../controllers/category.controller');
const validators = require('../validators/category.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, can } = require('../middleware/auth.middleware');
const { uploadCategoryImage } = require('../middleware/upload.middleware');

const router = express.Router();
const imageFields = uploadCategoryImage.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]);

router.get('/', controller.list);
router.get('/:id', validators.idParam, validate, controller.getById);

router.post(
  '/',
  authenticate,
  can('categories', 'create'),
  imageFields,
  validators.create,
  validate,
  controller.create
);
router.put(
  '/:id',
  authenticate,
  can('categories', 'edit'),
  imageFields,
  validators.update,
  validate,
  controller.update
);
router.delete('/:id', authenticate, can('categories', 'delete'), validators.idParam, validate, controller.remove);

module.exports = router;
