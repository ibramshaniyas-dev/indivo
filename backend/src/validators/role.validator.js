const { body } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('description').optional({ values: 'falsy' }).trim(),
  body('permissionCodes').optional().isArray(),
];

const update = create;

module.exports = { create, update };
