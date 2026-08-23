const db = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');
const { success } = require('../utils/response');
const razorpayService = require('../services/razorpay.service');
const shiprocketService = require('../services/shiprocket.service');

// Webhooks must always ACK with 2xx once the event is durably recorded, even if our own
// processing later fails — returning an error status makes the sender retry indefinitely and
// can pile up duplicate side effects. Failures are logged and left visible in webhook_events
// (status FAILED) for manual follow-up instead.

/**
 * Inserts the event row first (source, external_event_id) is UNIQUE, so a replay of the same
 * event is a no-op here — returns false without touching anything else.
 */
async function recordEvent({ source, eventType, externalEventId, payload }) {
  try {
    await db.query(
      `INSERT INTO webhook_events (source, event_type, external_event_id, payload, status)
       VALUES (:source, :eventType, :externalEventId, :payload, 'RECEIVED')`,
      { source, eventType, externalEventId, payload: JSON.stringify(payload) }
    );
    return true;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return false;
    throw err;
  }
}

async function markEvent(source, externalEventId, status) {
  await db.query(
    `UPDATE webhook_events SET status = :status, processed_at = NOW() WHERE source = :source AND external_event_id = :externalEventId`,
    { source, externalEventId, status }
  );
}

// ==================== RAZORPAY ====================

async function handlePaymentCaptured(payment) {
  await db.transaction(async (tx) => {
    const txn = await tx.queryOne('SELECT * FROM payment_transactions WHERE razorpay_order_id = :id', {
      id: payment.order_id,
    });
    if (!txn) {
      logger.warn('Razorpay webhook: payment.captured for unknown razorpay_order_id', { razorpayOrderId: payment.order_id });
      return;
    }
    if (txn.status === 'PAID') return; // already processed (e.g. via /payments/verify beating the webhook here)

    await tx.query(
      `UPDATE payment_transactions SET status = 'PAID', razorpay_payment_id = :paymentId,
         gateway_txn_id = :paymentId, raw_response = :raw WHERE id = :id`,
      { id: txn.id, paymentId: payment.id, raw: JSON.stringify(payment) }
    );
    await tx.query(`UPDATE orders SET payment_status = 'PAID' WHERE id = :orderId`, { orderId: txn.order_id });
  });
}

async function handlePaymentFailed(payment) {
  await db.transaction(async (tx) => {
    const txn = await tx.queryOne('SELECT * FROM payment_transactions WHERE razorpay_order_id = :id', {
      id: payment.order_id,
    });
    if (!txn) {
      logger.warn('Razorpay webhook: payment.failed for unknown razorpay_order_id', { razorpayOrderId: payment.order_id });
      return;
    }
    if (['PAID', 'FAILED'].includes(txn.status)) return;

    await tx.query(
      `UPDATE payment_transactions SET status = 'FAILED', razorpay_payment_id = :paymentId,
         failure_reason = :reason, raw_response = :raw WHERE id = :id`,
      { id: txn.id, paymentId: payment.id, reason: payment.error_description || 'Payment failed', raw: JSON.stringify(payment) }
    );
    await tx.query(`UPDATE orders SET payment_status = 'FAILED' WHERE id = :orderId`, { orderId: txn.order_id });
  });
}

async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  let externalEventId = null;
  try {
    if (!razorpayService.verifyWebhookSignature(req.rawBody, signature)) {
      logger.warn('Razorpay webhook: signature verification failed');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body || {};
    const eventType = event.event || 'unknown';
    const entity = event.payload?.payment?.entity || event.payload?.refund?.entity || {};
    // Razorpay's own event id (when present) is the strongest key; entity id + event type is a
    // solid fallback that's stable across redeliveries of the same event.
    externalEventId = event.id || `${eventType}:${entity.id || 'no-entity'}`;

    const isNew = await recordEvent({ source: 'RAZORPAY', eventType, externalEventId, payload: event });
    if (!isNew) return success(res, { message: 'Already processed' });

    if (eventType === 'payment.captured') {
      await handlePaymentCaptured(entity);
    } else if (eventType === 'payment.failed') {
      await handlePaymentFailed(entity);
    } else {
      logger.info('Razorpay webhook: unhandled event type, recorded only', { eventType });
    }

    await markEvent('RAZORPAY', externalEventId, 'PROCESSED');
    return success(res, { message: 'Webhook processed' });
  } catch (err) {
    logger.error('Razorpay webhook processing failed', { error: err.message, stack: err.stack });
    if (externalEventId) await markEvent('RAZORPAY', externalEventId, 'FAILED').catch(() => {});
    // Still ACK 200 — the event is durably recorded as FAILED for manual follow-up; a 5xx here
    // would just cause Razorpay to hammer this endpoint with retries of an event we already have.
    return success(res, { message: 'Webhook received' });
  }
}

// ==================== SHIPROCKET ====================

async function shiprocketWebhook(req, res) {
  let externalEventId = null;
  try {
    const providedToken = req.headers['x-api-key'] || req.headers['x-webhook-token'];
    if (!env.shiprocket.webhookToken || providedToken !== env.shiprocket.webhookToken) {
      logger.warn('Shiprocket webhook: token verification failed');
      return res.status(400).json({ success: false, message: 'Invalid webhook token' });
    }

    const payload = req.body || {};
    const awb = payload.awb || payload.awb_code || null;
    const rawStatus = payload.current_status || payload.shipment_status || payload.status || null;
    const shiprocketOrderId = payload.order_id ? String(payload.order_id) : null;
    const location = payload.location || payload.current_location || null;

    externalEventId = `${awb || shiprocketOrderId || 'no-ref'}:${rawStatus || 'no-status'}:${payload.updated_at || payload.timestamp || Date.now()}`;
    const isNew = await recordEvent({ source: 'SHIPROCKET', eventType: rawStatus || 'unknown', externalEventId, payload });
    if (!isNew) return success(res, { message: 'Already processed' });

    const shipment = awb
      ? await db.queryOne('SELECT * FROM shipments WHERE tracking_number = :awb', { awb })
      : shiprocketOrderId
        ? await db.queryOne('SELECT * FROM shipments WHERE shiprocket_order_id = :id', { id: shiprocketOrderId })
        : null;

    if (!shipment) {
      logger.warn('Shiprocket webhook: no matching shipment', { awb, shiprocketOrderId });
      await markEvent('SHIPROCKET', externalEventId, 'PROCESSED');
      return success(res, { message: 'Webhook received (no matching shipment)' });
    }

    await db.query(
      `INSERT IGNORE INTO shipment_tracking (shipment_id, status, location, note, tracked_at)
       VALUES (:shipmentId, :status, :location, :note, :trackedAt)`,
      {
        shipmentId: shipment.id, status: rawStatus || 'UPDATE', location, note: payload.remark || null,
        trackedAt: payload.updated_at || payload.timestamp || new Date(),
      }
    );

    const mappedStatus = shiprocketService.mapShiprocketStatus(rawStatus);
    if (mappedStatus && mappedStatus !== shipment.status) {
      await shiprocketService.applyShipmentStatus(shipment, mappedStatus, 'webhook');
    } else if (!mappedStatus) {
      logger.info('Shiprocket webhook: unrecognized status string, tracking-only', { rawStatus });
    }

    await markEvent('SHIPROCKET', externalEventId, 'PROCESSED');
    return success(res, { message: 'Webhook processed' });
  } catch (err) {
    logger.error('Shiprocket webhook processing failed', { error: err.message, stack: err.stack });
    if (externalEventId) await markEvent('SHIPROCKET', externalEventId, 'FAILED').catch(() => {});
    return success(res, { message: 'Webhook received' });
  }
}

module.exports = { razorpayWebhook, shiprocketWebhook };
