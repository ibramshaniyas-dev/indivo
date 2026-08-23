const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { success } = require('../../utils/response');

async function listPermissions(req, res, next) {
  try {
    const permissions = await db.query('SELECT id, module, action, code FROM permissions ORDER BY module ASC, action ASC');
    const byModule = permissions.reduce((acc, p) => {
      (acc[p.module] ||= []).push(p);
      return acc;
    }, {});
    return success(res, { data: byModule });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const roles = await db.query(
      `SELECT r.id, r.name, r.description, r.is_system, COUNT(rp.permission_id) AS permission_count,
              (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
       FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id
       WHERE r.scope = 'ADMIN'
       GROUP BY r.id ORDER BY r.is_system DESC, r.name ASC`
    );
    return success(res, { data: roles });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const role = await db.queryOne("SELECT * FROM roles WHERE id = :id AND scope = 'ADMIN'", { id: req.params.id });
    if (!role) throw ApiError.notFound('Role not found');
    const permissions = await db.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = :id`,
      { id: role.id }
    );
    return success(res, { data: { ...role, permissionCodes: permissions.map((p) => p.code) } });
  } catch (err) {
    return next(err);
  }
}

async function syncPermissions(tx, roleId, permissionCodes) {
  await tx.query('DELETE FROM role_permissions WHERE role_id = :roleId', { roleId });
  if (!permissionCodes?.length) return;
  const permissions = await tx.query(
    `SELECT id FROM permissions WHERE code IN (:codes)`,
    { codes: permissionCodes }
  );
  for (const permission of permissions) {
    await tx.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)', {
      roleId,
      permissionId: permission.id,
    });
  }
}

async function create(req, res, next) {
  try {
    const { name, description, permissionCodes } = req.body;
    const roleId = await db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO roles (name, description, scope, is_system) VALUES (:name, :description, 'ADMIN', 0)`,
        { name, description: description || null }
      );
      await syncPermissions(tx, result.insertId, permissionCodes);
      return result.insertId;
    });
    return success(res, { status: 201, message: 'Role created', data: { id: roleId } });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const role = await db.queryOne("SELECT * FROM roles WHERE id = :id AND scope = 'ADMIN'", { id: req.params.id });
    if (!role) throw ApiError.notFound('Role not found');
    if (role.is_system) throw ApiError.forbidden('System roles cannot be edited — clone it to create a custom variant instead');

    const { name, description, permissionCodes } = req.body;
    await db.transaction(async (tx) => {
      await tx.query('UPDATE roles SET name = :name, description = :description WHERE id = :id', {
        id: role.id,
        name: name ?? role.name,
        description: description ?? role.description,
      });
      if (permissionCodes !== undefined) await syncPermissions(tx, role.id, permissionCodes);
    });
    return success(res, { message: 'Role updated' });
  } catch (err) {
    return next(err);
  }
}

async function clone(req, res, next) {
  try {
    const role = await db.queryOne("SELECT * FROM roles WHERE id = :id AND scope = 'ADMIN'", { id: req.params.id });
    if (!role) throw ApiError.notFound('Role not found');
    const permissions = await db.query('SELECT permission_id FROM role_permissions WHERE role_id = :id', { id: role.id });

    const newRoleId = await db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO roles (name, description, scope, is_system) VALUES (:name, :description, 'ADMIN', 0)`,
        { name: `${role.name} (Copy)`, description: role.description }
      );
      for (const p of permissions) {
        await tx.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)', {
          roleId: result.insertId,
          permissionId: p.permission_id,
        });
      }
      return result.insertId;
    });
    return success(res, { status: 201, message: 'Role cloned', data: { id: newRoleId } });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const role = await db.queryOne("SELECT * FROM roles WHERE id = :id AND scope = 'ADMIN'", { id: req.params.id });
    if (!role) throw ApiError.notFound('Role not found');
    if (role.is_system) throw ApiError.forbidden('System roles cannot be deleted');
    const { count } = await db.queryOne('SELECT COUNT(*) AS count FROM user_roles WHERE role_id = :id', { id: role.id });
    if (Number(count) > 0) throw ApiError.conflict('Cannot delete a role that is assigned to admin users');
    await db.query('DELETE FROM roles WHERE id = :id', { id: role.id });
    return success(res, { message: 'Role deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listPermissions, list, getById, create, update, clone, remove };
