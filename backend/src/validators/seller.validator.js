const { body } = require('express-validator');

const register = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('displayName').trim().notEmpty().withMessage('Business display name is required'),
  body('businessCategory').optional({ values: 'falsy' }).trim(),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

const business = [
  body('legalName').optional({ values: 'falsy' }).trim(),
  body('gstNo').optional({ values: 'falsy' }).trim(),
  body('panNo').optional({ values: 'falsy' }).trim(),
  body('businessRegNo').optional({ values: 'falsy' }).trim(),
  body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
];

const bank = [
  body('accountHolderName').trim().notEmpty().withMessage('Account holder name is required'),
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('accountNumber').trim().isLength({ min: 6, max: 25 }).withMessage('Enter a valid account number'),
  body('ifsc').trim().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Enter a valid IFSC code'),
  body('branch').optional({ values: 'falsy' }).trim(),
];

const documentUpload = [body('docType').trim().notEmpty().withMessage('Document type is required')];

const reject = [body('reason').trim().notEmpty().withMessage('Rejection reason is required')];

const verifyDocument = [body('status').isIn(['VERIFIED', 'REJECTED']).withMessage('Invalid status')];

module.exports = { register, business, bank, documentUpload, reject, verifyDocument };
