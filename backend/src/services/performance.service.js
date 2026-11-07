const db = require('../config/database');

/**
 * Seller performance scorecard (0–100) from fulfilment behaviour over a window (default 90 days):
 * confirmation speed, late shipments, cancellations, RTO, rating, stock and catalogue quality.
 * Every deduction is returned with a plain-language reason so sellers know exactly what to fix.
 */

const SHIP_SLA_HOURS = 48;
const CONFIRM_SLA_HOURS = 24;
const DEMO_IMAGE = "(pi.url LIKE '%loremflickr.com%' OR pi.url LIKE '%picsum.photos%')";

const byId = (rows, key = 'sellerId') => new Map(rows.map((r) => [Number(r[key]), r]));
const n = (v) => Number(v || 0);

function band(score, orders) {
  if (orders < 3) return 'NEW';
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'NEEDS_ATTENTION';
  return 'AT_RISK';
}

function scoreSeller(m) {
  const deductions = [];
  const take = (points, reason) => { if (points > 0.5) deductions.push({ points: Math.round(points), reason }); };

  if (m.orders > 0) {
    take(Math.min(25, m.cancellationRate * 150), `${Math.round(m.cancellationRate * 100)}% of orders cancelled`);
    take(Math.min(25, m.lateShipRate * 50), `${Math.round(m.lateShipRate * 100)}% of orders not shipped within ${SHIP_SLA_HOURS}h`);
    take(Math.min(15, m.rtoRate * 75), `${Math.round(m.rtoRate * 100)}% of shipments returned to origin (RTO)`);
  }
  take(Math.min(15, m.pendingConfirm * 3), `${m.pendingConfirm} order(s) waiting more than ${CONFIRM_SLA_HOURS}h to be confirmed`);
  if (m.reviewCount >= 3 && m.rating < 4) take(Math.min(15, (4 - m.rating) * 10), `Average rating ${m.rating.toFixed(1)} (below 4.0)`);
  if (m.variants > 0) take(Math.min(10, (m.outOfStock / m.variants) * 20), `${m.outOfStock} of ${m.variants} live variants out of stock`);
  if (m.liveProducts > 0) take(Math.min(5, (m.noPhotoProducts / m.liveProducts) * 10), `${m.noPhotoProducts} live product(s) without a real photo`);

  const score = Math.max(0, 100 - deductions.reduce((s, d) => s + d.points, 0));
  return { score, band: band(score, m.orders), deductions: deductions.sort((a, b) => b.points - a.points) };
}

async function computeMetrics({ sellerId = null, days = 90 }) {
  const from = new Date(Date.now() - days * 86400000);
  const sellerFilter = sellerId ? ' AND s.id = :sellerId' : '';
  const params = { sellerId, from };

  const sellers = await db.query(
    `SELECT s.id AS sellerId, s.display_name AS name, s.status FROM sellers s
      WHERE s.status IN ('APPROVED','SUSPENDED')${sellerFilter} ORDER BY s.display_name`,
    params
  );

  const orders = byId(await db.query(
    `SELECT so.seller_id AS sellerId, COUNT(*) AS orders, SUM(so.status = 'CANCELLED') AS cancelled,
            AVG(TIMESTAMPDIFF(MINUTE, so.created_at, conf.at)) / 60 AS avgConfirmHours,
            AVG(TIMESTAMPDIFF(MINUTE, so.created_at, ship.at)) / 60 AS avgShipHours,
            SUM(so.status <> 'CANCELLED' AND (
                  (ship.at IS NOT NULL AND TIMESTAMPDIFF(HOUR, so.created_at, ship.at) > ${SHIP_SLA_HOURS})
               OR (ship.at IS NULL AND so.status IN ('PLACED','CONFIRMED','PROCESSING','PACKED') AND TIMESTAMPDIFF(HOUR, so.created_at, NOW()) > ${SHIP_SLA_HOURS})
            )) AS late,
            SUM(so.status <> 'CANCELLED') AS activeOrders
       FROM seller_orders so
       JOIN sellers s ON s.id = so.seller_id
       LEFT JOIN (SELECT seller_order_id, MIN(changed_at) AS at FROM order_status_history WHERE status = 'CONFIRMED' GROUP BY seller_order_id) conf
              ON conf.seller_order_id = so.id
       LEFT JOIN (SELECT seller_order_id, MIN(changed_at) AS at FROM order_status_history WHERE status IN ('SHIPPED','PICKED_UP','IN_TRANSIT') GROUP BY seller_order_id) ship
              ON ship.seller_order_id = so.id
      WHERE so.created_at >= :from${sellerFilter}
      GROUP BY so.seller_id`,
    params
  ));

  const pending = byId(await db.query(
    `SELECT so.seller_id AS sellerId, COUNT(*) AS pendingConfirm FROM seller_orders so JOIN sellers s ON s.id = so.seller_id
      WHERE so.status = 'PLACED' AND so.created_at < NOW() - INTERVAL ${CONFIRM_SLA_HOURS} HOUR${sellerFilter}
      GROUP BY so.seller_id`,
    params
  ));

  const shipments = byId(await db.query(
    `SELECT so.seller_id AS sellerId, COUNT(*) AS shipments,
            SUM(sh.status IN ('RTO_INITIATED','RTO_IN_TRANSIT','RTO_DELIVERED')) AS rto
       FROM shipments sh JOIN seller_orders so ON so.id = sh.seller_order_id JOIN sellers s ON s.id = so.seller_id
      WHERE sh.created_at >= :from${sellerFilter}
      GROUP BY so.seller_id`,
    params
  ));

  const reviews = byId(await db.query(
    `SELECT p.seller_id AS sellerId, COUNT(*) AS reviewCount, AVG(r.rating) AS rating
       FROM reviews r JOIN products p ON p.id = r.product_id JOIN sellers s ON s.id = p.seller_id
      WHERE r.status = 'APPROVED'${sellerFilter}
      GROUP BY p.seller_id`,
    params
  ));

  const stock = byId(await db.query(
    `SELECT p.seller_id AS sellerId, COUNT(DISTINCT p.id) AS liveProducts, COUNT(*) AS variants,
            SUM(i.available_stock <= 0) AS outOfStock
       FROM products p JOIN sellers s ON s.id = p.seller_id
       JOIN product_variants pv ON pv.product_id = p.id
       JOIN inventories i ON i.product_variant_id = pv.id
      WHERE p.status = 'ACTIVE'${sellerFilter}
      GROUP BY p.seller_id`,
    params
  ));

  const photos = byId(await db.query(
    `SELECT p.seller_id AS sellerId, COUNT(*) AS noPhotoProducts
       FROM products p JOIN sellers s ON s.id = p.seller_id
      WHERE p.status = 'ACTIVE'${sellerFilter}
        AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND NOT ${DEMO_IMAGE})
      GROUP BY p.seller_id`,
    params
  ));

  return sellers.map((s) => {
    const id = Number(s.sellerId);
    const o = orders.get(id) || {};
    const sh = shipments.get(id) || {};
    const rv = reviews.get(id) || {};
    const st = stock.get(id) || {};
    const total = n(o.orders);
    const active = n(o.activeOrders);
    const m = {
      sellerId: id,
      name: s.name,
      status: s.status,
      orders: total,
      cancelled: n(o.cancelled),
      cancellationRate: total ? n(o.cancelled) / total : 0,
      lateShipments: n(o.late),
      lateShipRate: active ? n(o.late) / active : 0,
      avgConfirmHours: o.avgConfirmHours === null || o.avgConfirmHours === undefined ? null : Number(o.avgConfirmHours),
      avgShipHours: o.avgShipHours === null || o.avgShipHours === undefined ? null : Number(o.avgShipHours),
      pendingConfirm: n(pending.get(id)?.pendingConfirm),
      shipments: n(sh.shipments),
      rtoRate: n(sh.shipments) ? n(sh.rto) / n(sh.shipments) : 0,
      reviewCount: n(rv.reviewCount),
      rating: rv.rating === null || rv.rating === undefined ? 0 : Number(rv.rating),
      liveProducts: n(st.liveProducts),
      variants: n(st.variants),
      outOfStock: n(st.outOfStock),
      noPhotoProducts: n(photos.get(id)?.noPhotoProducts),
    };
    return { ...m, ...scoreSeller(m) };
  });
}

async function sellerScorecards({ days = 90 } = {}) {
  const list = await computeMetrics({ days });
  const order = { AT_RISK: 0, NEEDS_ATTENTION: 1, GOOD: 2, EXCELLENT: 3, NEW: 4 };
  return list.sort((a, b) => order[a.band] - order[b.band] || a.score - b.score);
}

async function sellerScorecard(sellerId, { days = 90 } = {}) {
  const [card] = await computeMetrics({ sellerId, days });
  return card || null;
}

module.exports = { sellerScorecards, sellerScorecard, scoreSeller, SHIP_SLA_HOURS, CONFIRM_SLA_HOURS };
