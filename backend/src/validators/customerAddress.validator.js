const { body } = require('express-validator');

const upsert = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('addressLine1').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
  body('type').optional().isIn(['HOME', 'OFFICE', 'OTHER']),
];

module.exports = { upsert };
