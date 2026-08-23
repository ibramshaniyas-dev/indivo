const db = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const razorpayService = require('../services/razorpay.service');

function getConfig(req, res) {
  return success(res, {
    data: { onlinePaymentsEnabled: env.razorpay.isConfigured, keyId: env.razorpay.isConfigured ? env.razorpay.keyId : null },
  });
}

async function loadOwnedOrder(orderId, customerId) {
  const order = await db.queryOne('SELECT * FROM orders WHERE id = :id AND customer_id = :customerId', {
    id: orderId, customerId,
  });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

/**
 * Creates (or reuses) the Razorpay order for an already-placed ONLINE order, right before the
 * frontend opens Razorpay Checkout. Idempotent — a customer re-opening checkout after closing
 * the modal gets the same razorpay_order_id back instead of a fresh one piling up on the account.
 */
async function createPayment(req, res, next) {
  try {
    if (!env.razorpay.isConfigured) {
      throw new ApiError(503, 'Online payments are not available yet — please choose Cash on Delivery');
    }

    const order = await loadOwnedOrder(req.body.orderId, req.user.customerId);
    if (order.payment_method !== 'ONLINE') throw ApiError.badRequest('This order is not set up for online payment');
    if (order.payment_status === 'PAID') throw ApiError.conflict('This order is already paid');

    const txn = await db.queryOne('SELECT * FROM payment_transactions WHERE order_id = :orderId', { orderId: order.id });
    if (!txn) throw ApiError.notFound('Payment record not found for this order');

    if (txn.razorpay_order_id && txn.status !== 'FAILED') {
      return success(res, {
        data: {
          orderId: order.id, orderNumber: order.order_number, razorpayOrderId: txn.razorpay_order_id,
          amount: Number(order.grand_total), currency: 'INR', keyId: env.razorpay.keyId,
        },
      });
    }

    const razorpayOrder = await razorpayService.createOrder({
      amount: Number(order.grand_total),
      receipt: order.order_number,
      notes: { indivoOrderId: String(order.id), orderNumber: order.order_number },
    });

    await db.query(
      `UPDATE payment_transactions SET razorpay_order_id = :razorpayOrderId, status = 'PENDING', raw_response = :raw WHERE id = :id`,
      { id: txn.id, razorpayOrderId: razorpayOrder.id, raw: JSON.stringify(razorpayOrder) }
    );

    return success(res, {
      status: 201,
      data: {
        orderId: order.id, orderNumber: order.order_number, razorpayOrderId: razorpayOrder.id,
        amount: Number(order.grand_total), currency: 'INR', keyId: env.razorpay.keyId,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Server-side confirmation after Razorpay Checkout returns control to the frontend. This is what
 * actually marks the order PAID — the frontend's "success" callback firing is never trusted on
 * its own, only a signature Razorpay itself could only have produced with the account's secret.
 * The webhook (webhook.controller.js) covers the case where the customer closes the tab before
 * this call completes.
 */
async function verifyPayment(req, res, next) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const order = await loadOwnedOrder(orderId, req.user.customerId);

    const txn = await db.queryOne('SELECT * FROM payment_transactions WHERE order_id = :orderId', { orderId: order.id });
    if (!txn || txn.razorpay_order_id !== razorpayOrderId) {
      throw ApiError.badRequest('Payment does not match this order');
    }
    if (txn.status === 'PAID') {
      return success(res, { message: 'Payment already verified', data: { paymentStatus: 'PAID' } });
    }

    const isValid = razorpayService.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!isValid) {
      await db.query(
        `UPDATE payment_transactions SET status = 'FAILED', failure_reason = 'Signature verification failed' WHERE id = :id`,
        { id: txn.id }
      );
      throw ApiError.badRequest('Payment verification failed');
    }

    await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE payment_transactions SET status = 'PAID', razorpay_payment_id = :paymentId, razorpay_signature = :signature
         WHERE id = :id`,
        { id: txn.id, paymentId: razorpayPaymentId, signature: razorpaySignature }
      );
      await tx.query(`UPDATE orders SET payment_status = 'PAID' WHERE id = :orderId`, { orderId: order.id });
    });

    return success(res, { message: 'Payment verified', data: { paymentStatus: 'PAID' } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getConfig, createPayment, verifyPayment };
