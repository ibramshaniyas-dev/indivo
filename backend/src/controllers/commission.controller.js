const commission = require('../services/commission.service');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { success } = require('../utils/response');

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

/** range: '7d' | '30d' | '90d' | '365d' | 'all' (default 30d). */
function period(range) {
  const to = new Date(Date.now() + 60 * 1000);
  if (range === 'all') return { from: new Date('2000-01-01T00:00:00Z'), to, key: 'all' };
  const key = RANGE_DAYS[range] ? range : '30d';
  return { from: new Date(to.getTime() - RANGE_DAYS[key] * 86400000), to, key };
}

function parseRate(body) {
  const type = body.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const value = Number(body.value);
  if (!Number.isFinite(value) || value < 0) throw ApiError.badRequest('Commission must be a number of 0 or more');
  if (type === 'PERCENTAGE' && value > 100) throw ApiError.badRequest('Commission percentage cannot be more than 100');
  return { type, value: Math.round(value * 100) / 100 };
}

// ---------------- Admin ----------------

async function overview(req, res, next) {
  try {
    const p = period(req.query.range);
    const [summary, totals] = await Promise.all([
      commission.sellerCommissionSummary(p),
      commission.ledgerTotals({ sellerId: null, ...p }),
    ]);
    return success(res, { data: { range: p.key, ...summary, totals } });
  } catch (err) {
    return next(err);
  }
}

async function updateGlobal(req, res, next) {
  try {
    const rate = parseRate(req.body);
    await commission.setGlobalRule(rate);
    logger.info('Commission: default rate changed', { userId: req.user.id, ...rate });
    return success(res, { message: 'Default commission updated — applies to new orders' });
  } catch (err) {
    return next(err);
  }
}

async function updateSeller(req, res, next) {
  try {
    const sellerId = Number(req.params.sellerId);
    const seller = await db.queryOne('SELECT id, display_name FROM sellers WHERE id = :id', { id: sellerId });
    if (!seller) throw ApiError.notFound('Seller not found');
    const rate = parseRate(req.body);
    await commission.setSellerRule(sellerId, rate);
    logger.info('Commission: seller rate set', { userId: req.user.id, sellerId, ...rate });
    return success(res, { message: `Commission for ${seller.display_name} updated — applies to new orders` });
  } catch (err) {
    return next(err);
  }
}

async function resetSeller(req, res, next) {
  try {
    await commission.clearSellerRule(Number(req.params.sellerId));
    logger.info('Commission: seller rate reset to default', { userId: req.user.id, sellerId: req.params.sellerId });
    return success(res, { message: 'Seller now uses the default commission' });
  } catch (err) {
    return next(err);
  }
}

async function adminLedger(req, res, next) {
  try {
    const p = period(req.query.range);
    const sellerId = req.query.sellerId ? Number(req.query.sellerId) : null;
    const data = await commission.ledgerRows({ sellerId, ...p, page: Number(req.query.page) || 1, limit: Math.min(100, Number(req.query.limit) || 20) });
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

// ---------------- Seller ----------------

/** Seller's own commission rate, earnings totals and per-order commission ledger. */
async function sellerEarnings(req, res, next) {
  try {
    const p = period(req.query.range);
    const [rate, totals, ledger] = await Promise.all([
      commission.getEffectiveSellerRate(req.sellerId),
      commission.ledgerTotals({ sellerId: req.sellerId, ...p }),
      commission.ledgerRows({ sellerId: req.sellerId, ...p, page: Number(req.query.page) || 1, limit: Math.min(100, Number(req.query.limit) || 20) }),
    ]);
    return success(res, { data: { range: p.key, rate, totals, ledger } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { overview, updateGlobal, updateSeller, resetSeller, adminLedger, sellerEarnings };
