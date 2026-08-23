const { body, param } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('parentId').optional({ values: 'null' }).isInt().withMessage('Invalid parent category'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be a number'),
];

const update = [param('id').isInt(), ...create.map((rule) => rule.optional())];

const idParam = [param('id').isInt().withMessage('Invalid category id')];

module.exports = { create, update, idParam };
