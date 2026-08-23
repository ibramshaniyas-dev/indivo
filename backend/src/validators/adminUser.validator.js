const { body } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('email').isEmail().withMessage('A valid email is required for admin accounts'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('roleId').isInt().withMessage('A role must be assigned'),
];

const update = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('roleId').optional().isInt(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED']),
];

const resetPassword = [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')];

module.exports = { create, update, resetPassword };
