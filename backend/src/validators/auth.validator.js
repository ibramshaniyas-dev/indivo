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

const login = [
  body('identifier').trim().notEmpty().withMessage('Mobile number or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refresh = [body('refreshToken').notEmpty().withMessage('Refresh token is required')];

const updateMe = [
  body('name').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 150 }).withMessage('Name must be 2–150 characters'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
  body('mobile').optional({ values: 'falsy' }).trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

module.exports = { registerCustomer, login, refresh, updateMe, changePassword };
