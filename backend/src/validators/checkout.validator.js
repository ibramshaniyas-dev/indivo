const { body } = require('express-validator');

const placeOrder = [
  body('idempotencyKey').trim().notEmpty().withMessage('idempotencyKey is required'),
  body('paymentMethod').isIn(['COD']).withMessage('Only Cash on Delivery is supported right now'),
  body('address.name').trim().notEmpty().withMessage('Name is required'),
  body('address.mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('address.addressLine1').trim().notEmpty().withMessage('Address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pincode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
];

module.exports = { placeOrder };
