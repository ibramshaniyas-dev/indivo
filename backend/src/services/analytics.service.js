const db = require('../config/database');

/**
 * Business analytics shared by the seller dashboard (scoped to one seller) and the admin
 * dashboard (whole marketplace, sellerId = null).
 *
 * Money conventions (all from seller_orders, written at checkout):
 *   sales     = subtotal - discount          (what customers paid for the goods)
 *   earnings  = seller_payable               (sales + shipping - commission; what the seller is owed)
 *   commission= commission_amount            (platform revenue)
 * Cancelled sub-orders are excluded from money totals but counted in the cancellation rate.
 */

const RANGES = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
const RETURN_STATUSES = "'RETURN_REQUESTED','RETURN_APPROVED','RETURNED','REFUND_REQUESTED','REFUNDED'";
const IN_TRANSIT_SHIPMENT = "'PICKED_UP','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY'";

function periodBounds(range) {
  const days = RANGES[range] || 30;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  const prevFrom = new Date(from.getTime() - days * 86400000);
  return { days, from, to, prevFrom };
}

const scope = (sellerId, alias = 'so') => (sellerId ? ` AND ${alias}.seller_id = :sellerId` : '');
const n = (v) => Number(v || 0);

async function kpis({ sellerId, from, to }) {
  const row = await db.queryOne(
    `SELECT COUNT(*) AS orders,
            SUM(so.status = 'CANCELLED') AS cancelled,
            SUM(so.status IN (${RETURN_STATUSES})) AS returns,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN so.subtotal - so.discount END), 0) AS sales,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN so.seller_payable END), 0) AS earnings,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN so.commission_amount END), 0) AS commission,
            COUNT(DISTINCT o.customer_id) AS customers
       FROM seller_orders so JOIN orders o ON o.id = so.order_id
      WHERE so.created_at >= :from AND so.created_at < :to${scope(sellerId)}`,
    { sellerId, from, to }
  );
  const units = await db.queryOne(
    `SELECT COALESCE(SUM(oi.quantity), 0) AS units
       FROM order_items oi JOIN seller_orders so ON so.id = oi.seller_order_id
      WHERE oi.status = 'ACTIVE' AND so.status <> 'CANCELLED'
        AND so.created_at >= :from AND so.created_at < :to${scope(sellerId)}`,
    { sellerId, from, to }
  );
  const orders = n(row.orders);
  const active = orders - n(row.cancelled);
  return {
    sales: n(row.sales),
    earnings: n(row.earnings),
    commission: n(row.commission),
    orders,
    units: n(units.units),
    customers: n(row.customers),
    avgOrderValue: active > 0 ? n(row.sales) / active : 0,
    cancelled: n(row.cancelled),
    cancellationRate: orders > 0 ? n(row.cancelled) / orders : 0,
    returns: n(row.returns),
  };
}

function pctChange(curr, prev) {
  if (!prev) return curr ? null : 0; // null = "new" (no previous baseline)
  return (curr - prev) / prev;
}

async function trend({ sellerId, from, to, days }) {
  const monthly = days > 90;
  const bucket = monthly ? "DATE_FORMAT(so.created_at, '%Y-%m-01')" : 'DATE(so.created_at)';
  const rows = await db.query(
    `SELECT ${bucket} AS bucket,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN so.subtotal - so.discount END), 0) AS sales,
            COUNT(*) AS orders
       FROM seller_orders so
      WHERE so.created_at >= :from AND so.created_at < :to${scope(sellerId)}
      GROUP BY bucket ORDER BY bucket`,
    { sellerId, from, to }
  );
  const byKey = new Map(rows.map((r) => [String(r.bucket instanceof Date ? r.bucket.toISOString().slice(0, 10) : r.bucket).slice(0, 10), r]));

  // Fill gaps so the chart has a continuous axis (zero days are real zeros, not missing data).
  const points = [];
  const cursor = new Date(from);
  if (monthly) { cursor.setDate(1); }
  while (cursor < to) {
    const key = monthly
      ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`
      : cursor.toISOString().slice(0, 10);
    const r = byKey.get(key);
    points.push({ date: key, sales: n(r?.sales), orders: n(r?.orders) });
    if (monthly) cursor.setMonth(cursor.getMonth() + 1); else cursor.setDate(cursor.getDate() + 1);
  }
  return { granularity: monthly ? 'month' : 'day', points };
}

async function orderStatus({ sellerId, from, to }) {
  const rows = await db.query(
    `SELECT so.status, COUNT(*) AS count FROM seller_orders so
      WHERE so.created_at >= :from AND so.created_at < :to${scope(sellerId)}
      GROUP BY so.status ORDER BY count DESC`,
    { sellerId, from, to }
  );
  return rows.map((r) => ({ status: r.status, count: n(r.count) }));
}

/** Work waiting on someone right now (not limited to the selected period). */
async function actionQueue({ sellerId }) {
  const row = await db.queryOne(
    `SELECT SUM(so.status = 'PLACED') AS toConfirm,
            SUM(so.status IN ('CONFIRMED','PROCESSING')) AS toPack,
            SUM(so.status = 'PACKED') AS readyToShip,
            SUM(so.status IN ('SHIPPED','OUT_FOR_DELIVERY')) AS inTransit,
            SUM(so.status IN ('RETURN_REQUESTED','REFUND_REQUESTED')) AS returnRequests
       FROM seller_orders so WHERE 1 = 1${scope(sellerId)}`,
    { sellerId }
  );
  const ship = await db.queryOne(
    `SELECT SUM(sh.status IN ('PENDING','SHIPMENT_CREATED','AWB_ASSIGNED','PICKUP_REQUESTED')) AS awaitingPickup,
            SUM(sh.status IN ('RTO_INITIATED','RTO_IN_TRANSIT')) AS rto,
            SUM(sh.status = 'FAILED') AS failed
       FROM shipments sh JOIN seller_orders so ON so.id = sh.seller_order_id
      WHERE 1 = 1${scope(sellerId)}`,
    { sellerId }
  );
  return {
    toConfirm: n(row.toConfirm), toPack: n(row.toPack), readyToShip: n(row.readyToShip),
    inTransit: n(row.inTransit), returnRequests: n(row.returnRequests),
    awaitingPickup: n(ship.awaitingPickup), rto: n(ship.rto), failedShipments: n(ship.failed),
  };
}

async function shipping({ sellerId, from, to }) {
  const rows = await db.query(
    `SELECT sh.status, COUNT(*) AS count FROM shipments sh JOIN seller_orders so ON so.id = sh.seller_order_id
      WHERE sh.created_at >= :from AND sh.created_at < :to${scope(sellerId)}
      GROUP BY sh.status`,
    { sellerId, from, to }
  );
  const perf = await db.queryOne(
    `SELECT COUNT(*) AS total,
            SUM(sh.status = 'DELIVERED') AS delivered,
            SUM(sh.status IN ('RTO_INITIATED','RTO_IN_TRANSIT','RTO_DELIVERED')) AS rto,
            SUM(sh.status IN (${IN_TRANSIT_SHIPMENT})) AS inTransit,
            AVG(CASE WHEN sh.delivered_date IS NOT NULL THEN DATEDIFF(sh.delivered_date, so.created_at) END) AS avgDeliveryDays,
            COALESCE(SUM(sh.charge), 0) AS shippingCost
       FROM shipments sh JOIN seller_orders so ON so.id = sh.seller_order_id
      WHERE sh.created_at >= :from AND sh.created_at < :to${scope(sellerId)}`,
    { sellerId, from, to }
  );
  const total = n(perf.total);
  return {
    byStatus: rows.map((r) => ({ status: r.status, count: n(r.count) })),
    total,
    delivered: n(perf.delivered),
    inTransit: n(perf.inTransit),
    rto: n(perf.rto),
    rtoRate: total ? n(perf.rto) / total : 0,
    avgDeliveryDays: perf.avgDeliveryDays === null ? null : Number(perf.avgDeliveryDays),
    shippingCost: n(perf.shippingCost),
  };
}

async function payments({ sellerId, from, to }) {
  const rows = await db.query(
    `SELECT o.payment_method AS method, COUNT(*) AS orders,
            COALESCE(SUM(so.subtotal - so.discount), 0) AS sales
       FROM seller_orders so JOIN orders o ON o.id = so.order_id
      WHERE so.status <> 'CANCELLED' AND so.created_at >= :from AND so.created_at < :to${scope(sellerId)}
      GROUP BY o.payment_method`,
    { sellerId, from, to }
  );
  // COD money still with the courier/customer: COD sub-orders not yet delivered or cancelled.
  const cod = await db.queryOne(
    `SELECT COALESCE(SUM(so.subtotal - so.discount + so.shipping_charge), 0) AS pending, COUNT(*) AS orders
       FROM seller_orders so JOIN orders o ON o.id = so.order_id
      WHERE o.payment_method = 'COD' AND so.status NOT IN ('DELIVERED','CANCELLED',${RETURN_STATUSES})${scope(sellerId)}`,
    { sellerId }
  );
  const methods = ['ONLINE', 'COD'].map((m) => {
    const r = rows.find((x) => x.method === m);
    return { method: m, orders: n(r?.orders), sales: n(r?.sales) };
  });
  return { methods, codPendingAmount: n(cod.pending), codPendingOrders: n(cod.orders) };
}

async function topProducts({ sellerId, from, to, limit = 5 }) {
  const rows = await db.query(
    `SELECT oi.product_id AS productId, MAX(oi.product_name) AS name, MAX(p.slug) AS slug,
            SUM(oi.quantity) AS units, SUM(oi.total) AS sales,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY pi.is_primary DESC, pi.sort_order LIMIT 1) AS image
       FROM order_items oi
       JOIN seller_orders so ON so.id = oi.seller_order_id
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.status = 'ACTIVE' AND so.status <> 'CANCELLED'
        AND so.created_at >= :from AND so.created_at < :to${scope(sellerId)}
      GROUP BY oi.product_id ORDER BY sales DESC LIMIT ${Number(limit)}`,
    { sellerId, from, to }
  );
  return rows.map((r) => ({ ...r, units: n(r.units), sales: n(r.sales) }));
}

async function topLocations({ sellerId, from, to, limit = 5 }) {
  const rows = await db.query(
    `SELECT o.shipping_city AS city, o.shipping_state AS state, COUNT(*) AS orders,
            COALESCE(SUM(so.subtotal - so.discount), 0) AS sales
       FROM seller_orders so JOIN orders o ON o.id = so.order_id
      WHERE so.status <> 'CANCELLED' AND so.created_at >= :from AND so.created_at < :to${scope(sellerId)}
      GROUP BY o.shipping_city, o.shipping_state ORDER BY orders DESC, sales DESC LIMIT ${Number(limit)}`,
    { sellerId, from, to }
  );
  return rows.map((r) => ({ ...r, orders: n(r.orders), sales: n(r.sales) }));
}

async function inventoryHealth({ sellerId }) {
  const sellerFilter = sellerId ? ' AND p.seller_id = :sellerId' : '';
  const summary = await db.queryOne(
    `SELECT COUNT(DISTINCT p.id) AS liveProducts,
            SUM(i.available_stock <= 0) AS outOfStockVariants,
            SUM(i.available_stock > 0 AND i.available_stock <= i.low_stock_threshold) AS lowStockVariants,
            COALESCE(SUM(i.available_stock), 0) AS unitsInStock
       FROM products p
       JOIN product_variants pv ON pv.product_id = p.id
       JOIN inventories i ON i.product_variant_id = pv.id
      WHERE p.status = 'ACTIVE'${sellerFilter}`,
    { sellerId }
  );
  const lowStock = await db.query(
    `SELECT p.id AS productId, p.name, p.slug, pv.sku, i.available_stock AS stock, i.low_stock_threshold AS threshold
       FROM products p
       JOIN product_variants pv ON pv.product_id = p.id
       JOIN inventories i ON i.product_variant_id = pv.id
      WHERE p.status = 'ACTIVE' AND i.available_stock <= i.low_stock_threshold${sellerFilter}
      ORDER BY i.available_stock ASC, p.name LIMIT 8`,
    { sellerId }
  );
  const catalog = await db.query(
    `SELECT p.status, COUNT(*) AS count FROM products p WHERE 1 = 1${sellerFilter} GROUP BY p.status`,
    { sellerId }
  );
  return {
    liveProducts: n(summary.liveProducts),
    outOfStockVariants: n(summary.outOfStockVariants),
    lowStockVariants: n(summary.lowStockVariants),
    unitsInStock: n(summary.unitsInStock),
    lowStock: lowStock.map((r) => ({ ...r, stock: n(r.stock), threshold: n(r.threshold) })),
    catalogByStatus: catalog.map((r) => ({ status: r.status, count: n(r.count) })),
  };
}

async function recentOrders({ sellerId, limit = 6 }) {
  const rows = await db.query(
    `SELECT so.id, so.order_id AS orderId, so.sub_order_number AS orderNumber, so.status, so.created_at AS createdAt,
            so.subtotal - so.discount AS amount, o.payment_method AS paymentMethod,
            o.shipping_name AS customerName, o.shipping_city AS city, s.display_name AS sellerName,
            (SELECT sh.status FROM shipments sh WHERE sh.seller_order_id = so.id ORDER BY sh.id DESC LIMIT 1) AS shipmentStatus
       FROM seller_orders so
       JOIN orders o ON o.id = so.order_id
       JOIN sellers s ON s.id = so.seller_id
      WHERE 1 = 1${scope(sellerId)}
      ORDER BY so.created_at DESC LIMIT ${Number(limit)}`,
    { sellerId }
  );
  return rows.map((r) => ({ ...r, amount: n(r.amount) }));
}

async function reviews({ sellerId }) {
  const sellerFilter = sellerId ? ' AND p.seller_id = :sellerId' : '';
  const row = await db.queryOne(
    `SELECT COUNT(*) AS count, AVG(r.rating) AS avg FROM reviews r JOIN products p ON p.id = r.product_id
      WHERE r.status = 'APPROVED'${sellerFilter}`,
    { sellerId }
  );
  return { count: n(row.count), average: row.avg === null ? null : Number(row.avg) };
}

/** Marketplace-only blocks for the admin dashboard. */
async function platformExtras({ from, to }) {
  const topSellers = await db.query(
    `SELECT s.id, s.display_name AS name, COUNT(*) AS orders,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN so.subtotal - so.discount END), 0) AS sales,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN so.commission_amount END), 0) AS commission
       FROM seller_orders so JOIN sellers s ON s.id = so.seller_id
      WHERE so.created_at >= :from AND so.created_at < :to
      GROUP BY s.id, s.display_name ORDER BY sales DESC LIMIT 5`,
    { from, to }
  );
  const counts = await db.queryOne(
    `SELECT (SELECT COUNT(*) FROM sellers WHERE status = 'APPROVED') AS activeSellers,
            (SELECT COUNT(*) FROM sellers WHERE status IN ('SUBMITTED','UNDER_REVIEW')) AS pendingSellers,
            (SELECT COUNT(*) FROM products WHERE status = 'PENDING_REVIEW') AS pendingProducts,
            (SELECT COUNT(*) FROM customers) AS totalCustomers,
            (SELECT COUNT(*) FROM customers WHERE created_at >= :from AND created_at < :to) AS newCustomers`,
    { from, to }
  );
  return {
    topSellers: topSellers.map((r) => ({ ...r, orders: n(r.orders), sales: n(r.sales), commission: n(r.commission) })),
    activeSellers: n(counts.activeSellers),
    pendingSellers: n(counts.pendingSellers),
    pendingProducts: n(counts.pendingProducts),
    totalCustomers: n(counts.totalCustomers),
    newCustomers: n(counts.newCustomers),
  };
}

/** Full dashboard payload. sellerId = null → whole marketplace. */
async function getDashboard({ sellerId = null, range = '30d' }) {
  const { days, from, to, prevFrom } = periodBounds(range);
  const [current, previous, trendData, statuses, actions, ship, pay, products, locations, stock, recent, rating] = await Promise.all([
    kpis({ sellerId, from, to }),
    kpis({ sellerId, from: prevFrom, to: from }),
    trend({ sellerId, from, to, days }),
    orderStatus({ sellerId, from, to }),
    actionQueue({ sellerId }),
    shipping({ sellerId, from, to }),
    payments({ sellerId, from, to }),
    topProducts({ sellerId, from, to }),
    topLocations({ sellerId, from, to }),
    inventoryHealth({ sellerId }),
    recentOrders({ sellerId }),
    reviews({ sellerId }),
  ]);

  const change = Object.fromEntries(
    ['sales', 'earnings', 'commission', 'orders', 'units', 'customers', 'avgOrderValue'].map((k) => [k, pctChange(current[k], previous[k])])
  );

  const payload = {
    range: { key: RANGES[range] ? range : '30d', days, from, to },
    kpis: current,
    previous,
    change,
    trend: trendData,
    orderStatus: statuses,
    actions,
    shipping: ship,
    payments: pay,
    topProducts: products,
    topLocations: locations,
    inventory: stock,
    recentOrders: recent,
    reviews: rating,
  };
  if (!sellerId) payload.platform = await platformExtras({ from, to });
  return payload;
}

module.exports = { getDashboard, RANGES };
