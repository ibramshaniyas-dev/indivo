const db = require('../config/database');
const settlements = require('../services/settlement.service');
const performance = require('../services/performance.service');
const insights = require('../services/insights.service');
const searchAnalytics = require('../services/searchAnalytics.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { success } = require('../utils/response');

const wrap = (fn) => async (req, res, next) => {
  try { return await fn(req, res); } catch (err) { return next(err); }
};
const days = (q) => ([30, 90, 180, 365].includes(Number(q)) ? Number(q) : 90);

// ---------------- Admin: payouts ----------------

const payoutsDue = wrap(async (req, res) => success(res, { data: await settlements.payoutsDue() }));

const settlementHistory = wrap(async (req, res) => success(res, {
  data: await settlements.listSettlements({
    sellerId: req.query.sellerId ? Number(req.query.sellerId) : null,
    page: Number(req.query.page) || 1,
    limit: Math.min(100, Number(req.query.limit) || 20),
  }),
}));

const recordPayout = wrap(async (req, res) => {
  const sellerId = Number(req.params.sellerId);
  const referenceNo = String(req.body.referenceNo || '').trim();
  if (!referenceNo) throw ApiError.badRequest('Enter the bank UTR / transaction reference for this payout');
  if (referenceNo.length > 60) throw ApiError.badRequest('Reference is too long (max 60 characters)');
  let paidAt = null;
  if (req.body.paidAt) {
    paidAt = new Date(req.body.paidAt);
    if (Number.isNaN(paidAt.getTime()) || paidAt > new Date(Date.now() + 86400000)) throw ApiError.badRequest('Enter a valid payment date');
  }
  const seller = await db.queryOne('SELECT id, display_name FROM sellers WHERE id = :id', { id: sellerId });
  if (!seller) throw ApiError.notFound('Seller not found');

  const result = await settlements.recordPayout(sellerId, { referenceNo, notes: String(req.body.notes || '').slice(0, 255), paidAt }, req.user.id);
  logger.info('Seller payout recorded', { userId: req.user.id, sellerId, ...result, referenceNo });
  return success(res, {
    status: 201,
    message: `Payout of ₹${result.amount.toLocaleString('en-IN')} to ${seller.display_name} recorded (${result.orders} orders)`,
    data: result,
  });
});

// ---------------- Admin: performance & insights ----------------

const sellerPerformance = wrap(async (req, res) => success(res, { data: await performance.sellerScorecards({ days: days(req.query.days) }) }));
const adminInsights = wrap(async (req, res) => success(res, { data: await insights.platformInsights() }));

// ---------------- Seller ----------------

const myGrowth = wrap(async (req, res) => success(res, { data: await insights.sellerInsights(req.sellerId) }));
const mySettlements = wrap(async (req, res) => success(res, {
  data: await settlements.listSettlements({ sellerId: req.sellerId, page: Number(req.query.page) || 1, limit: Math.min(50, Number(req.query.limit) || 10) }),
}));

// Search analytics: 7 / 30 / 90 day windows.
const searchInsights = wrap(async (req, res) => {
  const d = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  return success(res, { data: await searchAnalytics.getInsights(d) });
});

module.exports = { payoutsDue, settlementHistory, recordPayout, sellerPerformance, adminInsights, searchInsights, myGrowth, mySettlements };
