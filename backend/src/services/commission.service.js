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

module.exports = { getCommissionRate, computeCommissionAmount };
