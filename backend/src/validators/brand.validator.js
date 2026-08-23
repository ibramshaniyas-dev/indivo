const { body, param } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Brand name is required'),
  body('website').optional({ values: 'falsy' }).isURL().withMessage('Enter a valid website URL'),
];

const update = [param('id').isInt(), ...create.map((rule) => rule.optional())];

const idParam = [param('id').isInt().withMessage('Invalid brand id')];

module.exports = { create, update, idParam };
