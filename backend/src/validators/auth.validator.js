const { body } = require('express-validator');

const mobileRule = body('mobile')
  .trim()
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Enter a valid 10-digit mobile number');

const registerCustomer = [
  mobileRule,
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email'),
  body('dob').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid date of birth'),
  body('gender').optional({ values: 'falsy' }).isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
];

const login = [mobileRule, body('password').notEmpty().withMessage('Password is required')];

const refresh = [body('refreshToken').notEmpty().withMessage('Refresh token is required')];

module.exports = { registerCustomer, login, refresh };
