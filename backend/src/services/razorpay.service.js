const crypto = require('crypto');
const Razorpay = require('razorpay');
const settings = require('./settings.service');

// Keys come from Super Admin → Settings → Razorpay (falling back to .env). The SDK client is
// cached per key pair and dropped whenever the Razorpay settings change.
let client = null;
let clientKey = '';

settings.onChange((groups) => {
  if (groups.includes('razorpay')) { client = null; clientKey = ''; }
});

async function getConfig() {
  const cfg = await settings.getGroup('razorpay');
  return { ...cfg, isConfigured: Boolean(cfg.key_id && cfg.key_secret) };
}

// Lazily constructed so the app can boot before real keys exist — every call fails loudly with
// a clear message instead of the whole process refusing to start.
async function getClient() {
  const cfg = await getConfig();
  if (!cfg.isConfigured) {
    throw new Error('Razorpay is not configured — add the keys in Super Admin → Settings → Razorpay');
  }
  const id = `${cfg.key_id}:${cfg.key_secret}`;
  if (!client || clientKey !== id) {
    client = new Razorpay({ key_id: cfg.key_id, key_secret: cfg.key_secret });
    clientKey = id;
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
  const rzp = await getClient();
  return rzp.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes,
  });
}

/** Server-side check after Razorpay Checkout returns — this is the only source of truth, never the frontend's reported success. */
async function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const { key_secret: keySecret } = await getConfig();
  if (!keySecret) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return timingSafeEqualHex(expected, razorpaySignature);
}

/** rawBody must be the exact bytes Razorpay sent (see app.js's express.json verify hook), not the re-serialized JSON. */
async function verifyWebhookSignature(rawBody, signature) {
  const { webhook_secret: webhookSecret } = await getConfig();
  if (!webhookSecret || !rawBody) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return timingSafeEqualHex(expected, signature);
}

async function fetchPayment(paymentId) {
  const rzp = await getClient();
  return rzp.payments.fetch(paymentId);
}

/** amount in rupees; omit for a full refund. */
async function createRefund(paymentId, amount) {
  const rzp = await getClient();
  return rzp.payments.refund(paymentId, amount ? { amount: Math.round(amount * 100) } : {});
}

/** Dashboard "Test connection": a cheap authenticated call with the current saved keys. */
async function testConnection() {
  const rzp = await getClient();
  await rzp.orders.all({ count: 1 });
  return true;
}

module.exports = {
  getConfig, createOrder, verifyPaymentSignature, verifyWebhookSignature, fetchPayment, createRefund, testConnection,
};
