const db = require('../config/database');

/**
 * Builds the req.user / login-response shape for an authenticated user, enriched with
 * type-specific context: seller staff get their seller/role, customers get their customer id,
 * admins get their resolved roles + flattened permission codes (used to drive frontend nav
 * and — critically — backend `can()` checks, which never trust the frontend).
 */
async function loadUserProfile(user) {
  const profile = {
    id: user.id,
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    userType: user.user_type,
  };

  if (user.user_type === 'CUSTOMER') {
    // A customer's display name lives on `customers`, not `users.name` (that column is only
    // populated for ADMIN accounts) — without this, the header/account UI has nothing but the
    // mobile number to show.
    const customer = await db.queryOne('SELECT id, name FROM customers WHERE user_id = :id', { id: user.id });
    if (customer) {
      profile.customerId = customer.id;
      profile.name = customer.name;
    }
    return profile;
  }

  if (user.user_type === 'SELLER_STAFF') {
    const sellerUser = await db.queryOne(
      `SELECT su.seller_id, su.seller_role, su.status AS seller_user_status, s.status AS seller_status, s.display_name AS seller_name
       FROM seller_users su JOIN sellers s ON s.id = su.seller_id
       WHERE su.user_id = :id`,
      { id: user.id }
    );
    if (sellerUser) {
      profile.sellerId = sellerUser.seller_id;
      profile.sellerRole = sellerUser.seller_role;
      profile.sellerUserStatus = sellerUser.seller_user_status;
      profile.sellerStatus = sellerUser.seller_status;
      profile.sellerName = sellerUser.seller_name;
    }
    return profile;
  }

  if (user.user_type === 'ADMIN') {
    const roles = await db.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id`,
      { id: user.id }
    );
    const permissions = await db.query(
      `SELECT DISTINCT p.code FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = :id`,
      { id: user.id }
    );
    profile.roles = roles.map((r) => r.name);
    profile.permissions = permissions.map((p) => p.code);
    profile.isSuperAdmin = profile.roles.includes('SUPER_ADMIN');
    return profile;
  }

  return profile;
}

module.exports = { loadUserProfile };
