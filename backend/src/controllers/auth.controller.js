const bcrypt = require('bcryptjs');
const env = require('../config/env');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const { sha256 } = require('../utils/hash');

function sanitizeUser(user, extra = {}) {
  return {
    id: user.id,
    mobile: user.mobile,
    email: user.email,
    userType: user.user_type,
    ...extra,
  };
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await db.query('UPDATE users SET refresh_token_hash = :hash, last_login_at = NOW() WHERE id = :id', {
    hash: sha256(refreshToken),
    id: user.id,
  });
  return { accessToken, refreshToken };
}

async function registerCustomer(req, res, next) {
  try {
    const { mobile, password, name, email, dob, gender } = req.body;

    const existing = await db.queryOne('SELECT id FROM users WHERE mobile = :mobile', { mobile });
    if (existing) throw ApiError.conflict('This mobile number is already registered');

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

    const user = await db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO users (mobile, email, password_hash, user_type, status)
         VALUES (:mobile, :email, :passwordHash, 'CUSTOMER', 'ACTIVE')`,
        { mobile, email: email || null, passwordHash }
      );
      const userId = result.insertId;
      await tx.query(
        `INSERT INTO customers (user_id, name, dob, gender)
         VALUES (:userId, :name, :dob, :gender)`,
        { userId, name, dob: dob || null, gender: gender || null }
      );
      return { id: userId, mobile, email: email || null, user_type: 'CUSTOMER' };
    });

    const tokens = await issueTokens(user);
    return success(res, {
      status: 201,
      message: 'Registration successful',
      data: { user: sanitizeUser(user), ...tokens },
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { mobile, password } = req.body;

    const user = await db.queryOne(
      'SELECT id, mobile, email, password_hash, user_type, status FROM users WHERE mobile = :mobile',
      { mobile }
    );
    if (!user) throw ApiError.unauthorized('Invalid mobile number or password');

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) throw ApiError.unauthorized('Invalid mobile number or password');

    if (user.status !== 'ACTIVE') throw ApiError.forbidden('Your account is not active');

    const extra = {};
    if (user.user_type === 'SELLER_STAFF') {
      const sellerUser = await db.queryOne(
        `SELECT su.seller_id, su.seller_role, su.status AS seller_user_status, s.status AS seller_status
         FROM seller_users su JOIN sellers s ON s.id = su.seller_id
         WHERE su.user_id = :id`,
        { id: user.id }
      );
      if (sellerUser) {
        extra.sellerId = sellerUser.seller_id;
        extra.sellerRole = sellerUser.seller_role;
        extra.sellerStatus = sellerUser.seller_status;
      }
    }

    const tokens = await issueTokens(user);
    return success(res, {
      message: 'Login successful',
      data: { user: sanitizeUser(user, extra), ...tokens },
    });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await db.queryOne(
      'SELECT id, mobile, email, user_type, status, refresh_token_hash FROM users WHERE id = :id',
      { id: payload.sub }
    );
    if (!user || user.status !== 'ACTIVE') throw ApiError.unauthorized('Account no longer active');
    if (!user.refresh_token_hash || user.refresh_token_hash !== sha256(refreshToken)) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    const tokens = await issueTokens(user);
    return success(res, { message: 'Token refreshed', data: tokens });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    await db.query('UPDATE users SET refresh_token_hash = NULL WHERE id = :id', { id: req.user.id });
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    return success(res, { message: 'Current user', data: req.user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { registerCustomer, login, refresh, logout, me };
