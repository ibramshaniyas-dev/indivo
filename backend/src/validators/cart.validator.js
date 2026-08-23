const { body, param } = require('express-validator');

const addItem = [
  body('productVariantId').isInt().withMessage('productVariantId is required'),
  body('quantity').optional().isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20'),
];

const updateItem = [
  param('itemId').isInt(),
  body('quantity').isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20'),
];

module.exports = { addItem, updateItem };
