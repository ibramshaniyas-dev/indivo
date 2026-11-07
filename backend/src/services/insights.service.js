const db = require('../config/database');
const performance = require('./performance.service');

/**
 * Rule-based "what to do next" recommendations. Each insight is concrete and actionable:
 *   { id, severity: 'critical'|'warning'|'info'|'success', title, detail, actionLabel, actionPath }
 * Seller paths are absolute; admin paths are relative to the admin base (/admin or /super-admin).
 */

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2, success: 3 };
const sortInsights = (list) => list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

async function sellerInsights(sellerId) {
  const out = [];
  const card = await performance.sellerScorecard(sellerId);

  const queue = await db.queryOne(
    `SELECT SUM(status = 'PLACED') AS toConfirm, SUM(status IN ('CONFIRMED','PROCESSING')) AS toPack, SUM(status = 'PACKED') AS packed
       FROM seller_orders WHERE seller_id = :sellerId`,
    { sellerId }
  );
  const money = await db.queryOne(
    `SELECT COALESCE(SUM(CASE WHEN status = 'DELIVERED' AND settlement_id IS NULL THEN seller_payable END), 0) AS readyForPayout,
            COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY AND status <> 'CANCELLED' THEN subtotal - discount END), 0) AS last30,
            COALESCE(SUM(CASE WHEN created_at < NOW() - INTERVAL 30 DAY AND created_at >= NOW() - INTERVAL 60 DAY AND status <> 'CANCELLED' THEN subtotal - discount END), 0) AS prev30
       FROM seller_orders WHERE seller_id = :sellerId`,
    { sellerId }
  );
  // Products that sold in the last 90 days but can't be bought right now.
  const oosSellers = await db.query(
    `SELECT p.id, p.name FROM products p
      WHERE p.seller_id = :sellerId AND p.status = 'ACTIVE'
        AND EXISTS (SELECT 1 FROM order_items oi JOIN seller_orders so ON so.id = oi.seller_order_id
                     WHERE oi.product_id = p.id AND so.status <> 'CANCELLED' AND so.created_at >= NOW() - INTERVAL 90 DAY)
        AND NOT EXISTS (SELECT 1 FROM product_variants pv JOIN inventories i ON i.product_variant_id = pv.id
                         WHERE pv.product_id = p.id AND i.available_stock > 0)
      LIMIT 5`,
    { sellerId }
  );
  const catalog = await db.queryOne(
    `SELECT SUM(status = 'DRAFT') AS drafts, SUM(status = 'REJECTED') AS rejected FROM products WHERE seller_id = :sellerId`,
    { sellerId }
  );

  if (card?.band === 'AT_RISK') {
    out.push({ id: 'score', severity: 'critical', title: `Your seller score is ${card.score}/100 (at risk)`, detail: card.deductions.slice(0, 2).map((d) => d.reason).join(' · '), actionLabel: 'See scorecard', actionPath: '/seller/dashboard#scorecard' });
  }
  if (card?.pendingConfirm) {
    out.push({ id: 'late-confirm', severity: 'critical', title: `${plural(card.pendingConfirm, 'order')} waiting over 24 hours`, detail: 'Customers are waiting. Confirm or cancel them now — slow confirmation lowers your score.', actionLabel: 'Confirm orders', actionPath: '/seller/orders?status=PLACED' });
  } else if (Number(queue.toConfirm)) {
    out.push({ id: 'new-orders', severity: 'info', title: `${plural(Number(queue.toConfirm), 'new order')} to confirm`, detail: 'Confirm within 24 hours to keep your score high.', actionLabel: 'View orders', actionPath: '/seller/orders?status=PLACED' });
  }
  if (Number(queue.packed)) {
    out.push({ id: 'packed', severity: 'warning', title: `${plural(Number(queue.packed), 'packed order')} ready to ship`, detail: `Book the courier so they ship within ${performance.SHIP_SLA_HOURS} hours of the order.`, actionLabel: 'Ship now', actionPath: '/seller/orders?status=PACKED' });
  }
  if (oosSellers.length) {
    out.push({ id: 'restock', severity: 'warning', title: `${plural(oosSellers.length, 'best-selling product')} out of stock`, detail: `${oosSellers.map((p) => p.name).slice(0, 3).join(', ')} sold recently but can't be bought now. Restock to avoid losing sales.`, actionLabel: 'Update stock', actionPath: '/seller/products' });
  }
  if (card?.noPhotoProducts) {
    out.push({ id: 'photos', severity: 'warning', title: `${plural(card.noPhotoProducts, 'product')} without a real photo`, detail: 'Products with clear photos of the actual item sell far better. Upload at least one sharp photo (1200px+).', actionLabel: 'Add photos', actionPath: '/seller/products' });
  }
  if (card?.orders >= 5 && card.cancellationRate > 0.1) {
    out.push({ id: 'cancellations', severity: 'warning', title: `High cancellation rate (${Math.round(card.cancellationRate * 100)}%)`, detail: 'Keep stock accurate so you only receive orders you can fulfil.', actionLabel: 'Review stock', actionPath: '/seller/products' });
  }
  if (Number(catalog.drafts) || Number(catalog.rejected)) {
    out.push({ id: 'drafts', severity: 'info', title: `${plural(Number(catalog.drafts) + Number(catalog.rejected), 'product')} not live yet`, detail: `${Number(catalog.drafts)} draft, ${Number(catalog.rejected)} rejected. Finish and submit them for review to grow your catalogue.`, actionLabel: 'Finish products', actionPath: '/seller/products' });
  }
  if (Number(money.readyForPayout) > 0) {
    out.push({ id: 'payout', severity: 'success', title: `${inr(money.readyForPayout)} ready for payout`, detail: 'Earnings from delivered orders. Make sure your bank details are correct.', actionLabel: 'View earnings', actionPath: '/seller/earnings' });
  }
  const last30 = Number(money.last30); const prev30 = Number(money.prev30);
  if (prev30 > 0 && last30 > prev30 * 1.2) {
    out.push({ id: 'growth', severity: 'success', title: `Sales up ${Math.round(((last30 - prev30) / prev30) * 100)}% this month`, detail: `${inr(last30)} in the last 30 days vs ${inr(prev30)} before. Keep your bestsellers in stock.`, actionLabel: 'See dashboard', actionPath: '/seller/dashboard' });
  } else if (prev30 > 0 && last30 < prev30 * 0.7) {
    out.push({ id: 'decline', severity: 'warning', title: `Sales down ${Math.round(((prev30 - last30) / prev30) * 100)}% this month`, detail: 'Check stock on your top products and refresh photos and prices.', actionLabel: 'See products', actionPath: '/seller/products' });
  }
  return { insights: sortInsights(out), scorecard: card };
}

async function platformInsights() {
  const out = [];
  const cards = await performance.sellerScorecards();
  const atRisk = cards.filter((c) => c.band === 'AT_RISK');
  const attention = cards.filter((c) => c.band === 'NEEDS_ATTENTION');

  const ops = await db.queryOne(
    `SELECT SUM(status = 'PLACED' AND created_at < NOW() - INTERVAL 24 HOUR) AS stuckOrders,
            COALESCE(SUM(CASE WHEN status = 'DELIVERED' AND settlement_id IS NULL THEN seller_payable END), 0) AS payoutsDue,
            COUNT(DISTINCT CASE WHEN status = 'DELIVERED' AND settlement_id IS NULL THEN seller_id END) AS payoutSellers
       FROM seller_orders`
  );
  const cod = await db.queryOne(
    `SELECT COALESCE(SUM(so.subtotal - so.discount + so.shipping_charge), 0) AS pending
       FROM seller_orders so JOIN orders o ON o.id = so.order_id
      WHERE o.payment_method = 'COD' AND so.status IN ('SHIPPED','OUT_FOR_DELIVERY')`
  );
  const approvals = await db.queryOne(
    `SELECT (SELECT COUNT(*) FROM sellers WHERE status IN ('SUBMITTED','UNDER_REVIEW')) AS sellers,
            (SELECT COUNT(*) FROM products WHERE status = 'PENDING_REVIEW') AS products`
  );
  const idle = await db.queryOne(
    `SELECT COUNT(*) AS idle FROM sellers s
      WHERE s.status = 'APPROVED'
        AND NOT EXISTS (SELECT 1 FROM seller_orders so WHERE so.seller_id = s.id AND so.created_at >= NOW() - INTERVAL 30 DAY)`
  );

  if (atRisk.length) {
    out.push({ id: 'at-risk', severity: 'critical', title: `${plural(atRisk.length, 'seller')} at risk`, detail: `${atRisk.slice(0, 3).map((c) => `${c.name} (${c.score})`).join(', ')} — slow fulfilment, cancellations or RTO are hurting customers.`, actionLabel: 'Review sellers', actionPath: '/seller-performance' });
  }
  if (Number(ops.stuckOrders)) {
    out.push({ id: 'stuck', severity: 'critical', title: `${plural(Number(ops.stuckOrders), 'order')} unconfirmed for over 24 hours`, detail: 'Nudge the sellers or cancel and refund to protect the customer experience.', actionLabel: 'View orders', actionPath: '/orders' });
  }
  if (attention.length) {
    out.push({ id: 'attention', severity: 'warning', title: `${plural(attention.length, 'seller')} need attention`, detail: attention.slice(0, 3).map((c) => `${c.name} (${c.score})`).join(', '), actionLabel: 'See scorecards', actionPath: '/seller-performance' });
  }
  if (Number(approvals.sellers) || Number(approvals.products)) {
    out.push({ id: 'approvals', severity: 'warning', title: 'Approvals waiting', detail: `${plural(Number(approvals.sellers), 'seller application')} and ${plural(Number(approvals.products), 'product')} waiting for review.`, actionLabel: 'Review now', actionPath: Number(approvals.sellers) ? '/sellers' : '/products?status=PENDING_REVIEW' });
  }
  if (Number(ops.payoutsDue) > 0) {
    out.push({ id: 'payouts', severity: 'info', title: `${inr(ops.payoutsDue)} due to ${plural(Number(ops.payoutSellers), 'seller')}`, detail: 'Delivered orders not yet paid out. Pay on time to keep good sellers.', actionLabel: 'Record payouts', actionPath: '/settlements' });
  }
  if (Number(cod.pending) > 0) {
    out.push({ id: 'cod', severity: 'info', title: `${inr(cod.pending)} COD with couriers`, detail: 'Cash on Delivery for shipped orders not yet delivered — track courier remittance.', actionLabel: 'View shipments', actionPath: '/shipments' });
  }
  if (Number(idle.idle)) {
    out.push({ id: 'idle', severity: 'info', title: `${plural(Number(idle.idle), 'seller')} had no sales in 30 days`, detail: 'Reach out to help them improve listings, photos and pricing.', actionLabel: 'See sellers', actionPath: '/seller-performance' });
  }
  return { insights: sortInsights(out) };
}

module.exports = { sellerInsights, platformInsights };
