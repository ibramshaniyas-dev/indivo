const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { success } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const admins = await db.query(
      `SELECT u.id, u.name, u.mobile, u.email, u.status, u.last_login_at, u.created_at,
              GROUP_CONCAT(r.name SEPARATOR ', ') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.user_type = 'ADMIN'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    return success(res, { data: admins });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const admin = await db.queryOne(
      "SELECT id, name, mobile, email, status, last_login_at, created_at FROM users WHERE id = :id AND user_type = 'ADMIN'",
      { id: req.params.id }
    );
    if (!admin) throw ApiError.notFound('Admin user not found');
    const roles = await db.query(
      `SELECT r.id, r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id`,
      { id: admin.id }
    );
    return success(res, { data: { ...admin, roles } });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, mobile, email, password, roleId } = req.body;

    const existing = await db.queryOne('SELECT id FROM users WHERE mobile = :mobile OR email = :email', { mobile, email });
    if (existing) throw ApiError.conflict('An account with this mobile number or email already exists');

    const role = await db.queryOne("SELECT id FROM roles WHERE id = :roleId AND scope = 'ADMIN'", { roleId });
    if (!role) throw ApiError.badRequest('Invalid role');

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

    const adminId = await db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO users (name, mobile, email, password_hash, user_type, status)
         VALUES (:name, :mobile, :email, :passwordHash, 'ADMIN', 'ACTIVE')`,
        { name, mobile, email, passwordHash }
      );
      await tx.query('INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)', {
        userId: result.insertId,
        roleId,
      });
      return result.insertId;
    });

    return success(res, { status: 201, message: 'Admin user created', data: { id: adminId } });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const admin = await db.queryOne("SELECT * FROM users WHERE id = :id AND user_type = 'ADMIN'", { id: req.params.id });
    if (!admin) throw ApiError.notFound('Admin user not found');

    const { name, email, roleId, status } = req.body;

    if (status && status !== 'ACTIVE' && Number(req.params.id) === req.user.id) {
      throw ApiError.badRequest('You cannot deactivate, suspend, or block your own account');
    }

    if (roleId !== undefined) {
      const currentlySuperAdmin = await db.queryOne(
        `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id AND r.name = 'SUPER_ADMIN'`,
        { id: admin.id }
      );
      if (currentlySuperAdmin) {
        const { count } = await db.queryOne(
          `SELECT COUNT(*) AS count FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'SUPER_ADMIN'`
        );
        if (Number(count) <= 1) throw ApiError.conflict('Cannot change the role of the last remaining Super Admin');
      }
    }

    await db.transaction(async (tx) => {
      await tx.query(
        'UPDATE users SET name = :name, email = :email, status = :status WHERE id = :id',
        { id: admin.id, name: name ?? admin.name, email: email ?? admin.email, status: status ?? admin.status }
      );
      if (roleId !== undefined) {
        await tx.query('DELETE FROM user_roles WHERE user_id = :id', { id: admin.id });
        await tx.query('INSERT INTO user_roles (user_id, role_id) VALUES (:id, :roleId)', { id: admin.id, roleId });
      }
    });

    return success(res, { message: 'Admin user updated' });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const admin = await db.queryOne("SELECT id FROM users WHERE id = :id AND user_type = 'ADMIN'", { id: req.params.id });
    if (!admin) throw ApiError.notFound('Admin user not found');
    const passwordHash = await bcrypt.hash(req.body.password, env.bcryptRounds);
    await db.query('UPDATE users SET password_hash = :passwordHash, refresh_token_hash = NULL WHERE id = :id', {
      id: admin.id,
      passwordHash,
    });
    return success(res, { message: 'Password reset — the admin has been logged out of all sessions' });
  } catch (err) {
    return next(err);
  }
}

async function forceLogout(req, res, next) {
  try {
    const admin = await db.queryOne("SELECT id FROM users WHERE id = :id AND user_type = 'ADMIN'", { id: req.params.id });
    if (!admin) throw ApiError.notFound('Admin user not found');
    await db.query('UPDATE users SET refresh_token_hash = NULL WHERE id = :id', { id: admin.id });
    return success(res, { message: 'Admin has been logged out of all sessions' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById, create, update, resetPassword, forceLogout };
