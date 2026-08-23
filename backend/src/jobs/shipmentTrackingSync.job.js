const cron = require('node-cron');
const db = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');
const shiprocketService = require('../services/shiprocket.service');

// A shipment in one of these is done moving — no point polling it anymore.
const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'FAILED', 'RTO_DELIVERED'];

let isRunning = false;

/**
 * Fallback for the Shiprocket webhook: polls every shipment that has an AWB and isn't in a
 * terminal state, so a courier-side status change still reaches the admin panel on a schedule
 * even if the webhook isn't configured yet in the Shiprocket dashboard, or a delivery drops.
 * The webhook (webhook.controller.js) is still the primary, near-real-time path when it's wired
 * up — this job is what keeps things fresh in the meantime and covers any gaps.
 */
async function runOnce() {
  const shipments = await db.query(
    `SELECT seller_order_id FROM shipments WHERE tracking_number IS NOT NULL AND status NOT IN (:terminal)`,
    { terminal: TERMINAL_STATUSES }
  );
  if (shipments.length === 0) {
    // Logged even when there's nothing to do — confirms each tick actually ran, rather than
    // leaving silence indistinguishable from "the job stopped running."
    logger.info('Shipment tracking sync: run complete, nothing to sync');
    return { checked: 0, failed: 0 };
  }

  let failed = 0;
  for (const { seller_order_id: sellerOrderId } of shipments) {
    try {
      await shiprocketService.syncShipmentStatus(sellerOrderId);
    } catch (err) {
      failed += 1;
      logger.warn('Shipment tracking sync: failed for one shipment, continuing with the rest', {
        sellerOrderId, error: err.message,
      });
    }
    // Small gap between calls — polite to Shiprocket's API rather than bursting every shipment at once.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  logger.info('Shipment tracking sync: run complete', { checked: shipments.length, failed });
  return { checked: shipments.length, failed };
}

/** Runs runOnce() with an overlap guard — a slow run (many shipments, network latency) must
 * never stack with the next scheduled tick and double-hit the same shipments. */
function runGuarded() {
  if (isRunning) {
    logger.warn('Shipment tracking sync: previous run still in progress, skipping this tick');
    return;
  }
  isRunning = true;
  runOnce()
    .catch((err) => logger.error('Shipment tracking sync: run failed', { error: err.message }))
    .finally(() => { isRunning = false; });
}

function start() {
  cron.schedule(env.shiprocket.trackingSyncCron, runGuarded);
  logger.info('Shipment tracking sync job scheduled', { cron: env.shiprocket.trackingSyncCron });
  // Run once at boot too — otherwise a fresh deploy waits up to a full interval before the first sync.
  runGuarded();
}

module.exports = { start, runOnce };
