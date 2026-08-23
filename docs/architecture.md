# INDIVO Architecture

## Stack
- Backend: Node.js/Express, raw `mysql2/promise` (no ORM) via `src/config/database.js` (`query`/`queryOne`/`transaction`)
- DB: MySQL, schema at `backend/database/schema.sql`, future changes in `backend/database/migrations/`
- Auth: JWT access (short-lived) + refresh (rotated, hashed in `users.refresh_token_hash`), `bcryptjs` password hashing
- Frontend: Vite + React + MUI + Redux Toolkit, single axios instance (`frontend/src/services/api.js`) with silent-refresh interceptor

## Backend layout
```
src/
  config/       env.js, database.js
  controllers/  thin — request/response only
  services/     cross-cutting transactional logic (order-splitting, stock reservation, commission, settlement, storage)
  routes/       one file per resource, mounted in routes/index.js
  middleware/   auth (JWT), sellerScope (seller ownership), can (admin RBAC), validate, error, rateLimit
  validators/   express-validator chains
  utils/        response envelope, logger, ApiError, token, hash
  jobs/         cron: unpaid-order expiry/stock release, settlement batch
```
No `repositories/`/`models/` layer — controllers query the pool directly, consistent with the user's other Node/MySQL projects.

## Multi-vendor isolation
Shared schema; every seller-owned table carries `seller_id`. `sellerScope` middleware pins `req.sellerId` from the authenticated seller-staff user — never trusts a client-supplied seller id. Admin routes bypass via RBAC (`can(module, action)`), never via a shared "trust the caller" path.

## RBAC
- Admin: fully dynamic — `roles` / `permissions` / `role_permissions` / `user_roles`, seeded by `backend/database/seed/seed.js` (SUPER_ADMIN + starter roles from `backend/database/seed/permissions.js`).
- Seller: fixed enum on `seller_users.seller_role` (OWNER/ADMIN/STAFF/INVENTORY_STAFF/ORDER_STAFF) for MVP; `roles.seller_id` reserved for future per-seller custom roles.
- Customer: no role table — pure row-ownership (`customer_id = req.user.customerId`).

## Order/stock integrity
- Stock reserved at order-placement time inside a DB transaction (`SELECT ... FOR UPDATE`), not at add-to-cart.
- `order_items` snapshot product name/SKU/price/tax; `orders` snapshot the shipping address as columns — both immune to later seller/customer edits.
- `orders.idempotency_key` and `payment_transactions.idempotency_key` are UNIQUE — duplicate checkout submits and duplicate payment webhooks are no-ops.
- Unpaid orders auto-expire (`order.unpaidExpiryMinutes` setting) and release reserved stock via a scheduled job.

## Full design doc
The original architecture proposal (missing-requirements analysis, full ~58-table ERD, role/permission model, API surface, phased MVP/Phase 2/Phase 3 breakdown, and edge-case table) was written to the plan file during planning and mirrors this document at greater length. This file is the living, in-repo summary — update it as the schema/architecture evolves.
