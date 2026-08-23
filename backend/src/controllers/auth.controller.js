const bcrypt = require('bcryptjs');
const env = require('../config/env');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const { sha256 } = require('../utils/hash');
const { loadUserProfile } = require('../services/authProfile.service');

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
      data: { user: await loadUserProfile(user), ...tokens },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Unified login for every portal (customer/seller/admin/super-admin). `identifier` matches
 * either mobile or email — customers/sellers conventionally sign in with mobile, admins with
 * email, but either works for any account type so a portal is free to ask for whichever fits
 * its audience. The portal itself is a frontend concept; this endpoint doesn't gate by userType
 * — the caller checks `user.userType`/`user.isSuperAdmin` in the response and rejects a mismatch
 * client-side, while every actual API is still independently authorized server-side.
 */
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    const user = await db.queryOne(
      'SELECT id, name, mobile, email, password_hash, user_type, status FROM users WHERE mobile = :identifier OR email = :identifier',
      { identifier }
    );
    if (!user) throw ApiError.unauthorized('Invalid credentials');

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) throw ApiError.unauthorized('Invalid credentials');

    if (user.status !== 'ACTIVE') throw ApiError.forbidden('Your account is not active');

    const tokens = await issueTokens(user);
    return success(res, {
      message: 'Login successful',
      data: { user: await loadUserProfile(user), ...tokens },
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
      'SELECT id, name, mobile, email, user_type, status, refresh_token_hash FROM users WHERE id = :id',
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
