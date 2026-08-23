// Module -> allowed actions. Drives the seeded `permissions` table.
// Admins can add further custom permissions later via the roles/permissions UI.
const MODULES = {
  customers: ['view', 'edit', 'delete'],
  sellers: ['view', 'create', 'edit', 'delete', 'approve'],
  seller_documents: ['view', 'approve'],
  products: ['view', 'create', 'edit', 'delete', 'approve'],
  categories: ['view', 'create', 'edit', 'delete'],
  brands: ['view', 'create', 'edit', 'delete'],
  attributes: ['view', 'create', 'edit', 'delete'],
  orders: ['view', 'edit'],
  payments: ['view'],
  refunds: ['view', 'approve'],
  returns: ['view', 'approve'],
  coupons: ['view', 'create', 'edit', 'delete'],
  offers: ['view', 'approve'],
  commission: ['view', 'edit'],
  settlements: ['view', 'approve', 'export'],
  reviews: ['view', 'approve', 'delete'],
  cms: ['view', 'create', 'edit', 'delete'],
  reports: ['view', 'export'],
  users: ['view', 'create', 'edit', 'delete'],
  roles: ['view', 'create', 'edit', 'delete'],
  settings: ['view', 'edit'],
  audit_logs: ['view'],
  notifications: ['view', 'create'],
};

const ROLE_MODULE_ACCESS = {
  MANAGER: Object.keys(MODULES),
  SUPPORT_ADMIN: ['customers', 'orders', 'returns', 'refunds', 'reviews', 'notifications'],
  PRODUCT_ADMIN: ['products', 'categories', 'brands', 'attributes', 'reviews'],
  ORDER_ADMIN: ['orders', 'payments', 'returns', 'refunds'],
  FINANCE_ADMIN: ['payments', 'refunds', 'commission', 'settlements', 'reports'],
  SELLER_ADMIN: ['sellers', 'seller_documents', 'offers'],
  CONTENT_ADMIN: ['cms', 'coupons'],
};

module.exports = { MODULES, ROLE_MODULE_ACCESS };
