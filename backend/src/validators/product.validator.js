const { body, param, query } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('categoryId').isInt().withMessage('Category is required'),
  body('brandId').optional({ values: 'null' }).isInt(),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('mrp').isFloat({ gt: 0 }).withMessage('MRP must be greater than 0'),
  body('sellingPrice').isFloat({ gt: 0 }).withMessage('Selling price must be greater than 0'),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('stock').optional().isInt({ min: 0 }),
  body('description').optional({ values: 'falsy' }).trim(),
  body('shortDescription').optional({ values: 'falsy' }).trim(),
];

const update = [param('id').isInt(), ...create.map((rule) => rule.optional())];

const idParam = [param('id').isInt().withMessage('Invalid product id')];

const addVariant = [
  body('sku').trim().notEmpty().withMessage('Variant SKU is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Variant price is required'),
  body('mrp').isFloat({ gt: 0 }).withMessage('Variant MRP is required'),
  body('stock').optional().isInt({ min: 0 }),
  body('attributes').optional().isArray(),
];

const list = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 60 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
];

module.exports = { create, update, idParam, addVariant, list };
