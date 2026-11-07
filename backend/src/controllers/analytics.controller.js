const analytics = require('../services/analytics.service');
const { success } = require('../utils/response');

/** Seller dashboard — always scoped to the caller's own seller account (req.sellerId from sellerScope). */
async function sellerDashboard(req, res, next) {
  try {
    const data = await analytics.getDashboard({ sellerId: req.sellerId, range: req.query.range });
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

/** Admin dashboard — whole marketplace. */
async function platformDashboard(req, res, next) {
  try {
    const data = await analytics.getDashboard({ sellerId: null, range: req.query.range });
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

module.exports = { sellerDashboard, platformDashboard };
