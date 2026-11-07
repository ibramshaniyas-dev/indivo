const db = require('../config/database');

const DEFAULT_RATE = { type: 'PERCENTAGE', value: 10 };

/** Resolves the applicable commission rule: PRODUCT > SELLER > CATEGORY > GLOBAL priority. */
async function getCommissionRate({ sellerId, categoryId, productId }, executor = db) {
  const rule = await executor.queryOne(
    `SELECT scope, type, value FROM commission_rules
     WHERE is_active = 1 AND (
       (scope = 'PRODUCT' AND scope_id = :productId) OR
       (scope = 'SELLER' AND scope_id = :sellerId) OR
       (scope = 'CATEGORY' AND scope_id = :categoryId) OR
       (scope = 'GLOBAL')
     )
     ORDER BY FIELD(scope, 'PRODUCT', 'SELLER', 'CATEGORY', 'GLOBAL') LIMIT 1`,
    { productId, sellerId, categoryId }
  );
  return rule || DEFAULT_RATE;
}

function computeCommissionAmount(rate, amount) {
  const value = Number(rate.value);
  if (rate.type === 'PERCENTAGE') return Math.round(((amount * value) / 100) * 100) / 100;
  return Math.min(value, amount);
}

// ---------------------------------------------------------------------------------------------
// Rate management (admin) — GLOBAL default + per-SELLER overrides. Changes apply to NEW orders;
// existing orders keep the commission calculated when they were placed.
// ---------------------------------------------------------------------------------------------

const toRule = (r) => (r ? { id: r.id, type: r.type, value: Number(r.value), updatedAt: r.created_at } : null);

async function getGlobalRule() {
  const r = await db.queryOne("SELECT * FROM commission_rules WHERE scope = 'GLOBAL' AND is_active = 1 ORDER BY id DESC LIMIT 1");
  return toRule(r) || { ...DEFAULT_RATE, id: null };
}

async function setGlobalRule({ type, value }) {
  return db.transaction(async (tx) => {
    const existing = await tx.queryOne("SELECT id FROM commission_rules WHERE scope = 'GLOBAL' AND is_active = 1 ORDER BY id DESC LIMIT 1");
    if (existing) {
      await tx.query('UPDATE commission_rules SET type = :type, value = :value WHERE id = :id', { id: existing.id, type, value });
    } else {
      await tx.query("INSERT INTO commission_rules (scope, scope_id, type, value, is_active) VALUES ('GLOBAL', NULL, :type, :value, 1)", { type, value });
    }
  });
}

async function setSellerRule(sellerId, { type, value }) {
  return db.transaction(async (tx) => {
    const existing = await tx.queryOne(
      "SELECT id FROM commission_rules WHERE scope = 'SELLER' AND scope_id = :sellerId ORDER BY id DESC LIMIT 1",
      { sellerId }
    );
    if (existing) {
      await tx.query('UPDATE commission_rules SET type = :type, value = :value, is_active = 1 WHERE id = :id', { id: existing.id, type, value });
    } else {
      await tx.query(
        "INSERT INTO commission_rules (scope, scope_id, type, value, is_active) VALUES ('SELLER', :sellerId, :type, :value, 1)",
        { sellerId, type, value }
      );
    }
  });
}

/** Removes a seller's custom rate so the marketplace default applies again. */
async function clearSellerRule(sellerId) {
  await db.query("UPDATE commission_rules SET is_active = 0 WHERE scope = 'SELLER' AND scope_id = :sellerId", { sellerId });
}

/** The rate a seller pays on new orders, and where it comes from. */
async function getEffectiveSellerRate(sellerId) {
  const custom = await db.queryOne(
    "SELECT * FROM commission_rules WHERE scope = 'SELLER' AND scope_id = :sellerId AND is_active = 1 ORDER BY id DESC LIMIT 1",
    { sellerId }
  );
  if (custom) return { ...toRule(custom), source: 'SELLER' };
  return { ...(await getGlobalRule()), source: 'GLOBAL' };
}

// ---------------------------------------------------------------------------------------------
// Commission tracking (ledger)
// ---------------------------------------------------------------------------------------------

const CLOSED_RETURN = "'RETURNED','REFUNDED'";

/**
 * Settlement stage of a sub-order, from the seller's point of view:
 *  CANCELLED / RETURNED → no commission, nothing payable
 *  DELIVERED            → earned, ready for payout
 *  anything else        → in progress (not yet earned)
 */
function stageOf(status) {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (['RETURNED', 'REFUNDED'].includes(status)) return 'RETURNED';
  if (status === 'DELIVERED') return 'EARNED';
  return 'IN_PROGRESS';
}

function ledgerWhere({ sellerId, from, to }) {
  const parts = ['so.created_at >= :from', 'so.created_at < :to'];
  if (sellerId) parts.push('so.seller_id = :sellerId');
  return `WHERE ${parts.join(' AND ')}`;
}

async function ledgerTotals({ sellerId, from, to }) {
  const row = await db.queryOne(
    `SELECT COUNT(*) AS orders,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('CANCELLED',${CLOSED_RETURN}) THEN so.subtotal - so.discount END), 0) AS sales,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('CANCELLED',${CLOSED_RETURN}) THEN so.commission_amount END), 0) AS commission,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('CANCELLED',${CLOSED_RETURN}) THEN so.seller_payable END), 0) AS payable,
            COALESCE(SUM(CASE WHEN so.status = 'DELIVERED' THEN so.commission_amount END), 0) AS earnedCommission,
            COALESCE(SUM(CASE WHEN so.status = 'DELIVERED' THEN so.seller_payable END), 0) AS readyForPayout,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('DELIVERED','CANCELLED',${CLOSED_RETURN}) THEN so.seller_payable END), 0) AS inProgressPayable,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('DELIVERED','CANCELLED',${CLOSED_RETURN}) THEN so.commission_amount END), 0) AS inProgressCommission
       FROM seller_orders so ${ledgerWhere({ sellerId, from, to })}`,
    { sellerId, from, to }
  );
  const sales = Number(row.sales);
  const commission = Number(row.commission);
  return {
    orders: Number(row.orders),
    sales,
    commission,
    payable: Number(row.payable),
    effectiveRate: sales > 0 ? commission / sales : 0,
    earnedCommission: Number(row.earnedCommission),
    readyForPayout: Number(row.readyForPayout),
    inProgressPayable: Number(row.inProgressPayable),
    inProgressCommission: Number(row.inProgressCommission),
  };
}

async function ledgerRows({ sellerId, from, to, page = 1, limit = 20 }) {
  const offset = (Math.max(1, page) - 1) * limit;
  const rows = await db.query(
    `SELECT so.id, so.order_id AS orderId, so.sub_order_number AS orderNumber, so.created_at AS createdAt, so.status,
            so.subtotal - so.discount AS sales, so.shipping_charge AS shipping, so.commission_amount AS commission,
            so.seller_payable AS payable, o.payment_method AS paymentMethod, o.payment_status AS paymentStatus,
            s.id AS sellerId, s.display_name AS sellerName
       FROM seller_orders so
       JOIN orders o ON o.id = so.order_id
       JOIN sellers s ON s.id = so.seller_id
       ${ledgerWhere({ sellerId, from, to })}
      ORDER BY so.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    { sellerId, from, to }
  );
  const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM seller_orders so ${ledgerWhere({ sellerId, from, to })}`, { sellerId, from, to });
  return {
    rows: rows.map((r) => {
      const sales = Number(r.sales);
      const commission = Number(r.commission);
      return {
        ...r, sales, commission, shipping: Number(r.shipping), payable: Number(r.payable),
        ratePercent: sales > 0 ? (commission / sales) * 100 : 0,
        stage: stageOf(r.status),
      };
    }),
    total: Number(total),
    page: Math.max(1, page),
    limit,
  };
}

/** Admin: every seller with their rate (custom or default) and commission totals for the period. */
async function sellerCommissionSummary({ from, to }) {
  const global = await getGlobalRule();
  const sellers = await db.query(
    `SELECT s.id, s.display_name AS name, s.status,
            cr.type AS customType, cr.value AS customValue,
            COUNT(so.id) AS orders,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('CANCELLED',${CLOSED_RETURN}) THEN so.subtotal - so.discount END), 0) AS sales,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('CANCELLED',${CLOSED_RETURN}) THEN so.commission_amount END), 0) AS commission,
            COALESCE(SUM(CASE WHEN so.status NOT IN ('CANCELLED',${CLOSED_RETURN}) THEN so.seller_payable END), 0) AS payable
       FROM sellers s
       LEFT JOIN commission_rules cr ON cr.scope = 'SELLER' AND cr.scope_id = s.id AND cr.is_active = 1
       LEFT JOIN seller_orders so ON so.seller_id = s.id AND so.created_at >= :from AND so.created_at < :to
      WHERE s.status IN ('APPROVED','SUSPENDED','SUBMITTED','UNDER_REVIEW')
      GROUP BY s.id, s.display_name, s.status, cr.type, cr.value
      ORDER BY sales DESC, s.display_name`,
    { from, to }
  );
  return {
    global,
    sellers: sellers.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      rate: s.customType ? { type: s.customType, value: Number(s.customValue), source: 'SELLER' } : { type: global.type, value: global.value, source: 'GLOBAL' },
      orders: Number(s.orders),
      sales: Number(s.sales),
      commission: Number(s.commission),
      payable: Number(s.payable),
    })),
  };
}

module.exports = {
  getCommissionRate, computeCommissionAmount,
  getGlobalRule, setGlobalRule, setSellerRule, clearSellerRule, getEffectiveSellerRate,
  ledgerTotals, ledgerRows, sellerCommissionSummary,
};
