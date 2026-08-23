const { body } = require('express-validator');

const updateStatus = [
  body('status').isIn(['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  body('trackingNumber').optional({ values: 'falsy' }).trim(),
  body('courierName').optional({ values: 'falsy' }).trim(),
  body('note').optional({ values: 'falsy' }).trim(),
];

module.exports = { updateStatus };
