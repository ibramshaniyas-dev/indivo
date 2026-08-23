const { body, param } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Attribute name is required'),
  body('inputType').optional().isIn(['SELECT', 'TEXT', 'NUMBER']).withMessage('Invalid input type'),
];

const idParam = [param('id').isInt().withMessage('Invalid attribute id')];

const addValue = [body('value').trim().notEmpty().withMessage('Value is required')];

module.exports = { create, idParam, addValue };
