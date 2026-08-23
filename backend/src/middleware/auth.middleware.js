const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Verifies the access token and attaches req.user.
 * For SELLER_STAFF, also attaches sellerId/sellerRole/sellerStatus from seller_users
 * so downstream sellerScope/ownership checks don't need another query.
 */
async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Authentication token missing');

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (err) {
      throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    }

    const user = await db.queryOne(
      'SELECT id, mobile, email, user_type, status FROM users WHERE id = :id',
      { id: payload.sub }
    );
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status !== 'ACTIVE') throw ApiError.forbidden('Account is not active');

    req.user = {
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      userType: user.user_type,
    };

    if (user.user_type === 'CUSTOMER') {
      const customer = await db.queryOne('SELECT id FROM customers WHERE user_id = :id', { id: user.id });
      if (customer) req.user.customerId = customer.id;
    }

    if (user.user_type === 'SELLER_STAFF') {
      const sellerUser = await db.queryOne(
        `SELECT su.seller_id, su.seller_role, su.status AS seller_user_status, s.status AS seller_status
         FROM seller_users su JOIN sellers s ON s.id = su.seller_id
         WHERE su.user_id = :id`,
        { id: user.id }
      );
      if (sellerUser) {
        req.user.sellerId = sellerUser.seller_id;
        req.user.sellerRole = sellerUser.seller_role;
        req.user.sellerUserStatus = sellerUser.seller_user_status;
        req.user.sellerStatus = sellerUser.seller_status;
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

/** Restricts a route to one or more user_type values. */
function requireUserType(...types) {
  return (req, res, next) => {
    if (!req.user || !types.includes(req.user.userType)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    return next();
  };
}

/**
 * For seller routes: ensures the caller is an active staff member of an approved seller
 * and pins req.sellerId so controllers/queries always filter by it. A seller can never
 * read/write another seller's data because every seller query must use req.sellerId,
 * not a client-supplied value.
 */
function sellerScope(req, res, next) {
  if (req.user?.userType !== 'SELLER_STAFF' || !req.user.sellerId) {
    return next(ApiError.forbidden('Seller account required'));
  }
  if (req.user.sellerUserStatus !== 'ACTIVE') {
    return next(ApiError.forbidden('Your seller staff account is not active'));
  }
  req.sellerId = req.user.sellerId;
  return next();
}

/** Restricts seller-scoped routes to specific seller_role values (e.g. only OWNER can add staff). */
function requireSellerRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.sellerRole || !roles.includes(req.user.sellerRole)) {
      return next(ApiError.forbidden('Your seller role does not permit this action'));
    }
    return next();
  };
}

/**
 * Admin RBAC: checks the caller (must be user_type ADMIN) holds a permission
 * matching `${module}.${action}` via user_roles -> role_permissions -> permissions.
 * Looked up per-request (not embedded in the JWT) so permission changes take effect
 * without forcing a re-login.
 */
function can(module, action) {
  return async (req, res, next) => {
    try {
      if (req.user?.userType !== 'ADMIN') {
        throw ApiError.forbidden('Admin access required');
      }
      const permission = await db.queryOne(
        `SELECT p.id
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE ur.user_id = :userId AND p.module = :module AND p.action = :action
         LIMIT 1`,
        { userId: req.user.id, module, action }
      );
      if (!permission) {
        throw ApiError.forbidden(`Missing permission: ${module}.${action}`);
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { authenticate, requireUserType, sellerScope, requireSellerRole, can };
