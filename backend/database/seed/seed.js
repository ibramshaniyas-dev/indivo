require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../../src/config/database');
const env = require('../../src/config/env');
const logger = require('../../src/utils/logger');
const { MODULES, ROLE_MODULE_ACCESS } = require('./permissions');

async function seedPermissions() {
  for (const [module, actions] of Object.entries(MODULES)) {
    for (const action of actions) {
      await db.query(
        `INSERT INTO permissions (module, action, code) VALUES (:module, :action, :code)
         ON DUPLICATE KEY UPDATE code = VALUES(code)`,
        { module, action, code: `${module}.${action}` }
      );
    }
  }
  console.log(`Seeded ${Object.values(MODULES).flat().length} permissions`);
}

// Fully syncs role_permissions to `permissionCodes` (deletes anything no longer listed) so
// re-running the seed after a starter-role definition changes doesn't leave stale, over-broad
// grants behind — e.g. MANAGER losing access to `users`/`roles` must actually revoke it.
//
// NOTE: can't lean on `INSERT ... ON DUPLICATE KEY UPDATE` against the (scope, name, seller_id)
// unique key here — seller_id is NULL for every admin role, and MySQL/InnoDB never treats two
// NULLs as equal for uniqueness, so that insert would silently create a duplicate role row on
// every re-run instead of updating the existing one. Select-then-insert-or-update explicitly.
async function seedRole(name, { isSystem = false, permissionCodes }) {
  let role = await db.queryOne(
    `SELECT id FROM roles WHERE scope = 'ADMIN' AND name = :name AND seller_id IS NULL`,
    { name }
  );

  if (role) {
    await db.query('UPDATE roles SET is_system = :isSystem WHERE id = :id', { id: role.id, isSystem: isSystem ? 1 : 0 });
  } else {
    const result = await db.query(
      `INSERT INTO roles (name, scope, is_system) VALUES (:name, 'ADMIN', :isSystem)`,
      { name, isSystem: isSystem ? 1 : 0 }
    );
    role = { id: result.insertId };
  }

  await db.query('DELETE FROM role_permissions WHERE role_id = :roleId', { roleId: role.id });

  const permissions = permissionCodes.length
    ? await db.query('SELECT id FROM permissions WHERE code IN (:codes)', { codes: permissionCodes })
    : [];

  for (const permission of permissions) {
    await db.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)`,
      { roleId: role.id, permissionId: permission.id }
    );
  }
  console.log(`Seeded role ${name} with ${permissions.length} permissions`);
  return role.id;
}

async function seedRoles() {
  const allCodes = Object.entries(MODULES).flatMap(([module, actions]) =>
    actions.map((action) => `${module}.${action}`)
  );
  const superAdminRoleId = await seedRole('SUPER_ADMIN', { isSystem: true, permissionCodes: allCodes });

  for (const [roleName, modules] of Object.entries(ROLE_MODULE_ACCESS)) {
    const codes = modules.flatMap((module) => MODULES[module].map((action) => `${module}.${action}`));
    await seedRole(roleName, { permissionCodes: codes });
  }

  return superAdminRoleId;
}

async function seedSuperAdminUser(superAdminRoleId) {
  const { mobile, password, name, email } = env.superAdmin;
  if (!mobile || !password) {
    console.log('SUPER_ADMIN_MOBILE/SUPER_ADMIN_PASSWORD not set — skipping super admin seed');
    return;
  }

  const existing = await db.queryOne('SELECT id FROM users WHERE mobile = :mobile', { mobile });
  let userId = existing?.id;

  if (!userId) {
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const result = await db.query(
      `INSERT INTO users (name, mobile, email, password_hash, user_type, status)
       VALUES (:name, :mobile, :email, :passwordHash, 'ADMIN', 'ACTIVE')`,
      { name, mobile, email: email || null, passwordHash }
    );
    userId = result.insertId;
    console.log(`Created super admin user (${name}) with mobile ${mobile}`);
  } else {
    console.log('Super admin user already exists — skipping creation');
  }

  await db.query(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)`, {
    userId,
    roleId: superAdminRoleId,
  });
}

async function seedSettings() {
  const defaults = [
    { group: 'general', key: 'site_name', value: 'INDIVO', value_type: 'STRING' },
    { group: 'general', key: 'support_email', value: 'support@indivo.iharogroups.com', value_type: 'STRING' },
    { group: 'marketplace', key: 'default_commission_percentage', value: '10', value_type: 'NUMBER' },
    { group: 'tax', key: 'default_tax_rate', value: '0', value_type: 'NUMBER' },
    { group: 'order', key: 'unpaid_order_expiry_minutes', value: String(env.order.unpaidExpiryMinutes), value_type: 'NUMBER' },
  ];

  for (const setting of defaults) {
    await db.query(
      `INSERT INTO settings (\`group\`, \`key\`, value, value_type) VALUES (:group, :key, :value, :value_type)
       ON DUPLICATE KEY UPDATE value = value`,
      setting
    );
  }
  console.log(`Seeded ${defaults.length} default settings`);
}

async function seedGlobalCommissionRule() {
  const existing = await db.queryOne("SELECT id FROM commission_rules WHERE scope = 'GLOBAL' LIMIT 1");
  if (existing) return;
  await db.query(
    `INSERT INTO commission_rules (scope, type, value, priority, is_active)
     VALUES ('GLOBAL', 'PERCENTAGE', 10, 0, 1)`
  );
  console.log('Seeded default global commission rule (10%)');
}

async function run() {
  try {
    await seedPermissions();
    const superAdminRoleId = await seedRoles();
    await seedSuperAdminUser(superAdminRoleId);
    await seedSettings();
    await seedGlobalCommissionRule();
    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', { error: err.message });
    console.error(err);
    process.exit(1);
  }
}

run();
