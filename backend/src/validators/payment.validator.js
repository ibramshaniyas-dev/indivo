const { body } = require('express-validator');

const createPayment = [
  body('orderId').isInt({ min: 1 }).withMessage('orderId is required'),
];

const verifyPayment = [
  body('orderId').isInt({ min: 1 }).withMessage('orderId is required'),
  body('razorpayOrderId').trim().notEmpty().withMessage('razorpayOrderId is required'),
  body('razorpayPaymentId').trim().notEmpty().withMessage('razorpayPaymentId is required'),
  body('razorpaySignature').trim().notEmpty().withMessage('razorpaySignature is required'),
];

module.exports = { createPayment, verifyPayment };
