const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');

let client = null;

// Lazily constructed so the app can boot before real keys exist — every call fails loudly with
// a clear message instead of the whole process refusing to start.
function getClient() {
  if (!env.razorpay.isConfigured) {
    throw new Error('Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
  return client;
}

function timingSafeEqualHex(expectedHex, actualHex) {
  if (typeof actualHex !== 'string') return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/** amount is in rupees; Razorpay's API wants paise. */
async function createOrder({ amount, receipt, notes }) {
  const rzp = getClient();
  return rzp.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes,
  });
}

/** Server-side check after Razorpay Checkout returns — this is the only source of truth, never the frontend's reported success. */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!env.razorpay.keySecret) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return timingSafeEqualHex(expected, razorpaySignature);
}

/** rawBody must be the exact bytes Razorpay sent (see app.js's express.json verify hook), not the re-serialized JSON. */
function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret || !rawBody) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return timingSafeEqualHex(expected, signature);
}

async function fetchPayment(paymentId) {
  const rzp = getClient();
  return rzp.payments.fetch(paymentId);
}

/** amount in rupees; omit for a full refund. */
async function createRefund(paymentId, amount) {
  const rzp = getClient();
  return rzp.payments.refund(paymentId, amount ? { amount: Math.round(amount * 100) } : {});
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature, fetchPayment, createRefund };
