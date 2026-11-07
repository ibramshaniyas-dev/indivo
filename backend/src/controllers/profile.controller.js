const bcrypt = require('bcryptjs');
const db = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { loadUserProfile } = require('../services/authProfile.service');

/** Signed-in user updates their own name / email / mobile (e.g. the Super Admin's profile). */
async function updateMe(req, res, next) {
  try {
    const { name, email, mobile } = req.body;
    const userId = req.user.id;

    if (mobile) {
      const clash = await db.queryOne('SELECT id FROM users WHERE mobile = :mobile AND id <> :id', { mobile, id: userId });
      if (clash) throw ApiError.conflict('That mobile number is already used by another account');
    }
    if (email) {
      const clash = await db.queryOne('SELECT id FROM users WHERE email = :email AND id <> :id', { email, id: userId });
      if (clash) throw ApiError.conflict('That email is already used by another account');
    }

    await db.query(
      `UPDATE users SET
         name = COALESCE(:name, name),
         email = COALESCE(:email, email),
         mobile = COALESCE(:mobile, mobile)
       WHERE id = :id`,
      { id: userId, name: name || null, email: email || null, mobile: mobile || null }
    );

    const user = await db.queryOne('SELECT id, name, mobile, email, user_type, status FROM users WHERE id = :id', { id: userId });
    return success(res, { message: 'Profile updated', data: await loadUserProfile(user) });
  } catch (err) {
    return next(err);
  }
}

/** Requires the current password; the session stays signed in. */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.queryOne('SELECT id, password_hash FROM users WHERE id = :id', { id: req.user.id });
    const ok = user && (await bcrypt.compare(currentPassword, user.password_hash));
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
    const hash = await bcrypt.hash(newPassword, env.bcryptRounds);
    await db.query('UPDATE users SET password_hash = :hash WHERE id = :id', { hash, id: req.user.id });
    return success(res, { message: 'Password changed' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { updateMe, changePassword };
