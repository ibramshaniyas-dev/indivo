const db = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Seller payouts. A sub-order becomes payable once it is DELIVERED; recording a payout links every
 * eligible sub-order (delivered, not yet settled) to one seller_settlements row. The rows are locked
 * inside the transaction, so the same order can never be paid twice.
 */

const ELIGIBLE = "so.status = 'DELIVERED' AND so.settlement_id IS NULL";

/** Admin: sellers with money waiting to be paid out. */
async function payoutsDue() {
  const rows = await db.query(
    `SELECT s.id AS sellerId, s.display_name AS sellerName,
            COUNT(so.id) AS orders,
            COALESCE(SUM(so.subtotal - so.discount), 0) AS sales,
            COALESCE(SUM(so.commission_amount), 0) AS commission,
            COALESCE(SUM(so.shipping_charge), 0) AS shipping,
            COALESCE(SUM(so.seller_payable), 0) AS payable,
            MIN(so.created_at) AS oldestOrder,
            ba.bank_name AS bankName, ba.account_number_last4 AS accountLast4, ba.ifsc, ba.account_holder_name AS accountHolder
       FROM seller_orders so
       JOIN sellers s ON s.id = so.seller_id
       LEFT JOIN seller_bank_accounts ba ON ba.seller_id = s.id
      WHERE ${ELIGIBLE}
      GROUP BY s.id, s.display_name, ba.bank_name, ba.account_number_last4, ba.ifsc, ba.account_holder_name
      ORDER BY payable DESC`
  );
  return rows.map((r) => ({
    ...r, orders: Number(r.orders), sales: Number(r.sales), commission: Number(r.commission),
    shipping: Number(r.shipping), payable: Number(r.payable),
  }));
}

/** Records a payout covering all of a seller's delivered, unsettled orders. */
async function recordPayout(sellerId, { referenceNo, notes, paidAt }, userId) {
  return db.transaction(async (tx) => {
    const orders = await tx.query(
      `SELECT so.id, so.created_at, so.subtotal - so.discount AS sales, so.commission_amount, so.shipping_charge, so.seller_payable
         FROM seller_orders so
        WHERE so.seller_id = :sellerId AND ${ELIGIBLE}
        FOR UPDATE`,
      { sellerId }
    );
    if (!orders.length) throw ApiError.badRequest('Nothing to pay — this seller has no delivered, unpaid orders');

    const sum = (k) => Math.round(orders.reduce((s, o) => s + Number(o[k]), 0) * 100) / 100;
    const dates = orders.map((o) => String(o.created_at).slice(0, 10)).sort();
    const result = await tx.query(
      `INSERT INTO seller_settlements
         (seller_id, period_start, period_end, orders_count, gross_sales, commission_amount, tax_amount, shipping_charges,
          refund_amount, net_payable, status, paid_at, paid_by, reference_no, notes)
       VALUES (:sellerId, :start, :end, :count, :gross, :commission, 0, :shipping, 0, :net, 'PAID', :paidAt, :paidBy, :ref, :notes)`,
      {
        sellerId, start: dates[0], end: dates[dates.length - 1], count: orders.length,
        gross: sum('sales'), commission: sum('commission_amount'), shipping: sum('shipping_charge'), net: sum('seller_payable'),
        paidAt: paidAt || new Date(), paidBy: userId, ref: referenceNo, notes: notes || null,
      }
    );
    await tx.query(
      `UPDATE seller_orders SET settlement_id = :settlementId WHERE id IN (${orders.map((o) => Number(o.id)).join(',')})`,
      { settlementId: result.insertId }
    );
    return { settlementId: result.insertId, orders: orders.length, amount: sum('seller_payable') };
  });
}

/** Payout history (admin: all sellers or one; seller: own). */
async function listSettlements({ sellerId = null, page = 1, limit = 20 }) {
  const where = sellerId ? 'WHERE st.seller_id = :sellerId' : '';
  const offset = (Math.max(1, page) - 1) * limit;
  const rows = await db.query(
    `SELECT st.id, st.seller_id AS sellerId, s.display_name AS sellerName, st.period_start AS periodStart, st.period_end AS periodEnd,
            st.orders_count AS orders, st.gross_sales AS sales, st.commission_amount AS commission, st.shipping_charges AS shipping,
            st.net_payable AS amount, st.status, st.paid_at AS paidAt, st.reference_no AS referenceNo, st.notes,
            u.name AS paidByName
       FROM seller_settlements st
       JOIN sellers s ON s.id = st.seller_id
       LEFT JOIN users u ON u.id = st.paid_by
       ${where}
      ORDER BY st.paid_at DESC, st.id DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    { sellerId }
  );
  const [{ total, paid }] = await db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(net_payable), 0) AS paid FROM seller_settlements st ${where}`,
    { sellerId }
  );
  return {
    rows: rows.map((r) => ({ ...r, orders: Number(r.orders), sales: Number(r.sales), commission: Number(r.commission), shipping: Number(r.shipping), amount: Number(r.amount) })),
    total: Number(total),
    totalPaid: Number(paid),
    page: Math.max(1, page),
    limit,
  };
}

module.exports = { payoutsDue, recordPayout, listSettlements };
