const db = require('../config/database');
const { success } = require('../utils/response');
const { placeOrder } = require('../services/checkout.service');

async function checkout(req, res, next) {
  try {
    const { address, paymentMethod, idempotencyKey } = req.body;
    const result = await placeOrder({ customerId: req.user.customerId, address, paymentMethod, idempotencyKey });

    if (!result.duplicate) {
      // Best-effort: remember this address for next time. Not critical to the order itself.
      db.query(
        `INSERT INTO customer_addresses (customer_id, name, mobile, address_line1, address_line2, city, district, state, pincode, type, is_default)
         SELECT :customerId, :name, :mobile, :address1, :address2, :city, :city, :state, :pincode, 'HOME', 1
         WHERE NOT EXISTS (SELECT 1 FROM customer_addresses WHERE customer_id = :customerId)`,
        {
          customerId: req.user.customerId, name: address.name, mobile: address.mobile,
          address1: address.addressLine1, address2: address.addressLine2 || null,
          city: address.city, state: address.state, pincode: address.pincode,
        }
      ).catch(() => {});
    }

    return success(res, {
      status: result.duplicate ? 200 : 201,
      message: result.duplicate ? 'Order already placed' : 'Order placed successfully',
      data: { orderId: result.orderId, publicId: result.publicId },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { checkout };
