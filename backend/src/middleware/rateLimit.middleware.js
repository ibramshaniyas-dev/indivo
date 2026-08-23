const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { error } = require('../utils/response');

function makeLimiter(max, message) {
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => error(res, { status: 429, message }),
  });
}

module.exports = {
  generalLimiter: makeLimiter(env.rateLimit.max, 'Too many requests, please try again later'),
  authLimiter: makeLimiter(env.rateLimit.authMax, 'Too many attempts, please try again later'),
  checkoutLimiter: makeLimiter(env.rateLimit.checkoutMax, 'Too many checkout attempts, please slow down'),
  webhookLimiter: makeLimiter(env.rateLimit.webhookMax, 'Too many requests'),
};
