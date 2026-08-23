-- ============================================================
-- INDIVO Multi-Vendor Marketplace — Canonical Schema
-- Fresh-install schema. Future changes go in database/migrations/.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- IDENTITY & RBAC
-- ============================================================

CREATE TABLE users (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mobile              VARCHAR(15) NOT NULL,
  email               VARCHAR(150) NULL,
  password_hash       VARCHAR(255) NOT NULL,
  user_type           ENUM('CUSTOMER','SELLER_STAFF','ADMIN') NOT NULL,
  status              ENUM('ACTIVE','INACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  refresh_token_hash  CHAR(64) NULL,
  last_login_at       DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_mobile (mobile),
  KEY idx_users_user_type (user_type)
) ENGINE=InnoDB;

CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  scope       ENUM('ADMIN','SELLER') NOT NULL DEFAULT 'ADMIN',
  seller_id   INT UNSIGNED NULL,
  is_system   TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_scope_name_seller (scope, name, seller_id)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module      VARCHAR(60) NOT NULL,
  action      VARCHAR(30) NOT NULL,
  code        VARCHAR(100) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_code (code),
  UNIQUE KEY uq_permissions_module_action (module, action)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id        INT UNSIGNED NOT NULL,
  permission_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id  INT UNSIGNED NOT NULL,
  role_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE otp_verifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mobile      VARCHAR(15) NOT NULL,
  otp_hash    CHAR(64) NOT NULL,
  purpose     ENUM('LOGIN','REGISTER','RESET_PASSWORD') NOT NULL,
  expires_at  DATETIME NOT NULL,
  verified_at DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_otp_mobile_purpose (mobile, purpose)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  user_type   VARCHAR(20) NULL,
  action      VARCHAR(60) NOT NULL,
  module      VARCHAR(60) NOT NULL,
  record_id   VARCHAR(60) NULL,
  old_value   JSON NULL,
  new_value   JSON NULL,
  ip_address  VARCHAR(45) NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_module_record (module, record_id),
  KEY idx_audit_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- CUSTOMER
-- ============================================================

CREATE TABLE customers (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  dob            DATE NULL,
  gender         ENUM('MALE','FEMALE','OTHER') NULL,
  profile_image  VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customers_user (user_id),
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customer_addresses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  mobile         VARCHAR(15) NOT NULL,
  address_line1  VARCHAR(255) NOT NULL,
  address_line2  VARCHAR(255) NULL,
  city           VARCHAR(100) NOT NULL,
  district       VARCHAR(100) NULL,
  state          VARCHAR(100) NOT NULL,
  pincode        VARCHAR(10) NOT NULL,
  landmark       VARCHAR(255) NULL,
  type           ENUM('HOME','OFFICE','OTHER') NOT NULL DEFAULT 'HOME',
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_customer_addresses_customer (customer_id),
  CONSTRAINT fk_customer_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SELLER
-- ============================================================

CREATE TABLE sellers (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id          CHAR(36) NOT NULL,
  company_name       VARCHAR(200) NOT NULL,
  display_name       VARCHAR(150) NOT NULL,
  legal_name         VARCHAR(200) NULL,
  seller_type        VARCHAR(50) NULL,
  business_category  VARCHAR(100) NULL,
  gst_no             VARCHAR(20) NULL,
  pan_no             VARCHAR(15) NULL,
  business_reg_no    VARCHAR(50) NULL,
  contact_person     VARCHAR(150) NULL,
  status             ENUM('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','SUSPENDED','BLOCKED') NOT NULL DEFAULT 'DRAFT',
  rejection_reason   VARCHAR(500) NULL,
  agreement_accepted_at DATETIME NULL,
  agreement_version  VARCHAR(20) NULL,
  approved_by        INT UNSIGNED NULL,
  approved_at        DATETIME NULL,
  deleted_at         DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sellers_public_id (public_id),
  KEY idx_sellers_status (status),
  CONSTRAINT fk_sellers_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE seller_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  seller_id     INT UNSIGNED NOT NULL,
  seller_role   ENUM('OWNER','ADMIN','STAFF','INVENTORY_STAFF','ORDER_STAFF') NOT NULL,
  status        ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seller_users_user (user_id),
  KEY idx_seller_users_seller (seller_id),
  CONSTRAINT fk_seller_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_users_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE seller_addresses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id      INT UNSIGNED NOT NULL,
  type           ENUM('REGISTERED','WAREHOUSE','PICKUP') NOT NULL DEFAULT 'REGISTERED',
  address_line1  VARCHAR(255) NOT NULL,
  address_line2  VARCHAR(255) NULL,
  city           VARCHAR(100) NOT NULL,
  district       VARCHAR(100) NULL,
  state          VARCHAR(100) NOT NULL,
  pincode        VARCHAR(10) NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_seller_addresses_seller (seller_id),
  CONSTRAINT fk_seller_addresses_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE seller_documents (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id    INT UNSIGNED NOT NULL,
  doc_type     VARCHAR(60) NOT NULL,
  file_url     VARCHAR(255) NOT NULL,
  status       ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
  verified_by  INT UNSIGNED NULL,
  verified_at  DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_seller_documents_seller (seller_id),
  CONSTRAINT fk_seller_documents_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_documents_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE seller_bank_accounts (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id            INT UNSIGNED NOT NULL,
  account_holder_name  VARCHAR(150) NOT NULL,
  bank_name            VARCHAR(150) NOT NULL,
  account_number_enc   VARCHAR(255) NOT NULL,
  account_number_last4 VARCHAR(4) NOT NULL,
  ifsc                 VARCHAR(15) NOT NULL,
  branch               VARCHAR(150) NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seller_bank_seller (seller_id),
  CONSTRAINT fk_seller_bank_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CATALOG
-- ============================================================

CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id   INT UNSIGNED NULL,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(180) NOT NULL,
  image       VARCHAR(255) NULL,
  banner      VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE brands (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  slug         VARCHAR(180) NOT NULL,
  logo         VARCHAR(255) NULL,
  description  TEXT NULL,
  website      VARCHAR(255) NULL,
  status       ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_brands_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE attributes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  input_type  ENUM('SELECT','TEXT','NUMBER') NOT NULL DEFAULT 'SELECT',
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attributes_name (name)
) ENGINE=InnoDB;

CREATE TABLE attribute_values (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attribute_id  INT UNSIGNED NOT NULL,
  value         VARCHAR(150) NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_attribute_values (attribute_id, value),
  CONSTRAINT fk_attribute_values_attribute FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE category_attributes (
  category_id   INT UNSIGNED NOT NULL,
  attribute_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (category_id, attribute_id),
  CONSTRAINT fk_category_attributes_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_category_attributes_attribute FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE products (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id          CHAR(36) NOT NULL,
  seller_id          INT UNSIGNED NOT NULL,
  category_id        INT UNSIGNED NOT NULL,
  brand_id           INT UNSIGNED NULL,
  name               VARCHAR(255) NOT NULL,
  slug               VARCHAR(280) NOT NULL,
  sku                VARCHAR(60) NOT NULL,
  description        TEXT NULL,
  short_description  VARCHAR(500) NULL,
  mrp                DECIMAL(12,2) NOT NULL,
  selling_price      DECIMAL(12,2) NOT NULL,
  tax_rate           DECIMAL(5,2) NOT NULL DEFAULT 0,
  hsn_code           VARCHAR(20) NULL,
  weight_grams       INT UNSIGNED NULL,
  length_cm          DECIMAL(8,2) NULL,
  width_cm           DECIMAL(8,2) NULL,
  height_cm          DECIMAL(8,2) NULL,
  return_policy      VARCHAR(500) NULL,
  warranty           VARCHAR(255) NULL,
  status             ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','ACTIVE','INACTIVE','OUT_OF_STOCK','BLOCKED') NOT NULL DEFAULT 'DRAFT',
  is_featured        TINYINT(1) NOT NULL DEFAULT 0,
  is_bestseller      TINYINT(1) NOT NULL DEFAULT 0,
  is_trending        TINYINT(1) NOT NULL DEFAULT 0,
  approved_by        INT UNSIGNED NULL,
  approved_at        DATETIME NULL,
  deleted_at         DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_public_id (public_id),
  UNIQUE KEY uq_products_seller_sku (seller_id, sku),
  KEY idx_products_category (category_id),
  KEY idx_products_brand (brand_id),
  KEY idx_products_status (status),
  KEY idx_products_slug (slug),
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE product_variants (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  sku         VARCHAR(60) NOT NULL,
  price       DECIMAL(12,2) NOT NULL,
  mrp         DECIMAL(12,2) NOT NULL,
  barcode     VARCHAR(60) NULL,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_variants_sku (sku),
  KEY idx_product_variants_product (product_id),
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_variant_attributes (
  variant_id          INT UNSIGNED NOT NULL,
  attribute_id        INT UNSIGNED NOT NULL,
  attribute_value_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (variant_id, attribute_id),
  CONSTRAINT fk_pva_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_pva_attribute FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
  CONSTRAINT fk_pva_attribute_value FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  variant_id  INT UNSIGNED NULL,
  url         VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_primary  TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_product_images_product (product_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_images_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_videos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  url         VARCHAR(255) NOT NULL,
  KEY idx_product_videos_product (product_id),
  CONSTRAINT fk_product_videos_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE warehouses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id      INT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  address_line1  VARCHAR(255) NULL,
  city           VARCHAR(100) NULL,
  state          VARCHAR(100) NULL,
  pincode        VARCHAR(10) NULL,
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_warehouses_seller (seller_id),
  CONSTRAINT fk_warehouses_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventories (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_variant_id   INT UNSIGNED NOT NULL,
  warehouse_id         INT UNSIGNED NOT NULL,
  available_stock      INT NOT NULL DEFAULT 0,
  reserved_stock       INT NOT NULL DEFAULT 0,
  low_stock_threshold  INT NOT NULL DEFAULT 5,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventories_variant_warehouse (product_variant_id, warehouse_id),
  CONSTRAINT fk_inventories_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventories_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventory_transactions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inventory_id    INT UNSIGNED NOT NULL,
  type            ENUM('PURCHASE','SALE','RETURN','DAMAGE','ADJUSTMENT','TRANSFER') NOT NULL,
  quantity        INT NOT NULL,
  reference_type  VARCHAR(60) NULL,
  reference_id    VARCHAR(60) NULL,
  notes           VARCHAR(255) NULL,
  created_by      INT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inventory_transactions_inventory (inventory_id),
  CONSTRAINT fk_inventory_transactions_inventory FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CART & WISHLIST
-- ============================================================

CREATE TABLE carts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_carts_customer (customer_id),
  CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id             INT UNSIGNED NOT NULL,
  product_variant_id  INT UNSIGNED NOT NULL,
  seller_id           INT UNSIGNED NOT NULL,
  quantity            INT NOT NULL DEFAULT 1,
  price_snapshot      DECIMAL(12,2) NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_items_cart_variant (cart_id, product_variant_id),
  KEY idx_cart_items_seller (seller_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wishlists (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL DEFAULT 'My Wishlist',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_wishlists_customer (customer_id),
  CONSTRAINT fk_wishlists_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wishlist_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wishlist_id  INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  variant_id   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_items (wishlist_id, product_id, variant_id),
  CONSTRAINT fk_wishlist_items_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- PROMOTIONS (created before orders — orders.coupon_id references coupons)
-- ============================================================

CREATE TABLE coupons (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                      VARCHAR(40) NOT NULL,
  type                      ENUM('PERCENTAGE','FIXED') NOT NULL,
  value                     DECIMAL(12,2) NOT NULL,
  min_order_value           DECIMAL(12,2) NULL,
  max_discount              DECIMAL(12,2) NULL,
  starts_at                 DATETIME NOT NULL,
  ends_at                   DATETIME NOT NULL,
  usage_limit_total         INT NULL,
  usage_limit_per_customer  INT NULL,
  status                    ENUM('ACTIVE','INACTIVE','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  created_by                INT UNSIGNED NULL,
  deleted_at                DATETIME NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupons_code (code)
) ENGINE=InnoDB;

CREATE TABLE coupon_scopes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id   INT UNSIGNED NOT NULL,
  scope_type  ENUM('CATEGORY','PRODUCT','SELLER') NOT NULL,
  scope_id    INT UNSIGNED NOT NULL,
  KEY idx_coupon_scopes_coupon (coupon_id),
  CONSTRAINT fk_coupon_scopes_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id           CHAR(36) NOT NULL,
  order_number        VARCHAR(30) NOT NULL,
  customer_id         INT UNSIGNED NOT NULL,
  shipping_name       VARCHAR(150) NOT NULL,
  shipping_mobile     VARCHAR(15) NOT NULL,
  shipping_address1   VARCHAR(255) NOT NULL,
  shipping_address2   VARCHAR(255) NULL,
  shipping_city       VARCHAR(100) NOT NULL,
  shipping_state      VARCHAR(100) NOT NULL,
  shipping_pincode    VARCHAR(10) NOT NULL,
  coupon_id           INT UNSIGNED NULL,
  subtotal            DECIMAL(12,2) NOT NULL,
  discount            DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax                 DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_charge     DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total         DECIMAL(12,2) NOT NULL,
  payment_status      ENUM('PENDING','AUTHORIZED','SUCCESS','FAILED','REFUNDED','PARTIAL_REFUND') NOT NULL DEFAULT 'PENDING',
  status              ENUM('PLACED','CONFIRMED','PARTIALLY_FULFILLED','COMPLETED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PLACED',
  idempotency_key     VARCHAR(80) NOT NULL,
  placed_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orders_public_id (public_id),
  UNIQUE KEY uq_orders_order_number (order_number),
  UNIQUE KEY uq_orders_idempotency_key (idempotency_key),
  KEY idx_orders_customer (customer_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE seller_orders (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id           INT UNSIGNED NOT NULL,
  seller_id          INT UNSIGNED NOT NULL,
  sub_order_number   VARCHAR(40) NOT NULL,
  subtotal           DECIMAL(12,2) NOT NULL,
  discount           DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax                DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_charge    DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  seller_payable     DECIMAL(12,2) NOT NULL DEFAULT 0,
  status             ENUM('PLACED','CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','RETURN_REQUESTED','RETURN_APPROVED','RETURNED','REFUND_REQUESTED','REFUNDED') NOT NULL DEFAULT 'PLACED',
  cancelled_reason   VARCHAR(255) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seller_orders_sub_order_number (sub_order_number),
  KEY idx_seller_orders_order (order_id),
  KEY idx_seller_orders_seller (seller_id),
  KEY idx_seller_orders_status (status),
  CONSTRAINT fk_seller_orders_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_orders_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_order_id     INT UNSIGNED NOT NULL,
  product_id          INT UNSIGNED NOT NULL,
  product_variant_id  INT UNSIGNED NOT NULL,
  product_name        VARCHAR(255) NOT NULL,
  sku                 VARCHAR(60) NOT NULL,
  price               DECIMAL(12,2) NOT NULL,
  mrp                 DECIMAL(12,2) NOT NULL,
  quantity            INT NOT NULL,
  tax_amount          DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  total               DECIMAL(12,2) NOT NULL,
  status              ENUM('ACTIVE','CANCELLED','RETURNED') NOT NULL DEFAULT 'ACTIVE',
  KEY idx_order_items_seller_order (seller_order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE order_status_history (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_order_id  INT UNSIGNED NOT NULL,
  status           VARCHAR(30) NOT NULL,
  note             VARCHAR(255) NULL,
  changed_by       INT UNSIGNED NULL,
  changed_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_status_history_seller_order (seller_order_id),
  CONSTRAINT fk_order_status_history_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payment_gateways (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(40) NOT NULL,
  name       VARCHAR(100) NOT NULL,
  config     JSON NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_payment_gateways_code (code)
) ENGINE=InnoDB;

CREATE TABLE payment_transactions (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id         INT UNSIGNED NOT NULL,
  gateway_id       INT UNSIGNED NULL,
  method           ENUM('ONLINE','COD') NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  status           ENUM('PENDING','AUTHORIZED','SUCCESS','FAILED','REFUNDED','PARTIAL_REFUND') NOT NULL DEFAULT 'PENDING',
  gateway_txn_id   VARCHAR(100) NULL,
  idempotency_key  VARCHAR(100) NOT NULL,
  raw_response     JSON NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_transactions_idempotency_key (idempotency_key),
  KEY idx_payment_transactions_order (order_id),
  CONSTRAINT fk_payment_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_transactions_gateway FOREIGN KEY (gateway_id) REFERENCES payment_gateways(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE coupon_usages (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id         INT UNSIGNED NOT NULL,
  customer_id       INT UNSIGNED NOT NULL,
  order_id          INT UNSIGNED NOT NULL,
  discount_amount   DECIMAL(12,2) NOT NULL,
  used_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_coupon_usages_coupon (coupon_id),
  KEY idx_coupon_usages_customer (customer_id),
  CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_usages_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_usages_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SELLER OFFERS
-- ============================================================

CREATE TABLE seller_offers (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id    INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL,
  type         VARCHAR(40) NOT NULL,
  value        DECIMAL(12,2) NULL,
  starts_at    DATETIME NOT NULL,
  ends_at      DATETIME NOT NULL,
  status       ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  approved_by  INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_seller_offers_seller (seller_id),
  CONSTRAINT fk_seller_offers_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_offers_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      INT UNSIGNED NOT NULL,
  customer_id     INT UNSIGNED NOT NULL,
  order_item_id   INT UNSIGNED NULL,
  rating          TINYINT UNSIGNED NOT NULL,
  title           VARCHAR(150) NULL,
  description     TEXT NULL,
  status          ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reviews_product (product_id),
  KEY idx_reviews_customer (customer_id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE review_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id  INT UNSIGNED NOT NULL,
  url        VARCHAR(255) NOT NULL,
  CONSTRAINT fk_review_images_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- RETURNS & SHIPPING
-- ============================================================

CREATE TABLE returns (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id     INT UNSIGNED NOT NULL,
  seller_order_id   INT UNSIGNED NOT NULL,
  reason            VARCHAR(60) NOT NULL,
  description        VARCHAR(500) NULL,
  status            ENUM('REQUESTED','APPROVED','REJECTED','PICKUP','RECEIVED','INSPECTED','REFUND_INITIATED','COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  requested_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at       DATETIME NULL,
  KEY idx_returns_order_item (order_item_id),
  KEY idx_returns_seller_order (seller_order_id),
  CONSTRAINT fk_returns_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_returns_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE return_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_id  INT UNSIGNED NOT NULL,
  url        VARCHAR(255) NOT NULL,
  CONSTRAINT fk_return_images_return FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE shipments (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_order_id      INT UNSIGNED NOT NULL,
  courier_name         VARCHAR(100) NULL,
  tracking_number      VARCHAR(100) NULL,
  method               ENUM('STANDARD','EXPRESS','SELLER_PICKUP') NOT NULL DEFAULT 'STANDARD',
  charge               DECIMAL(12,2) NOT NULL DEFAULT 0,
  estimated_delivery   DATE NULL,
  status               ENUM('PENDING','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED') NOT NULL DEFAULT 'PENDING',
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shipments_seller_order (seller_order_id),
  CONSTRAINT fk_shipments_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE shipment_tracking (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id   INT UNSIGNED NOT NULL,
  status        VARCHAR(60) NOT NULL,
  location      VARCHAR(150) NULL,
  note          VARCHAR(255) NULL,
  tracked_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_shipment_tracking_shipment (shipment_id),
  CONSTRAINT fk_shipment_tracking_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- REFUNDS (after returns/payment_transactions exist)
-- ============================================================

CREATE TABLE refunds (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_order_id          INT UNSIGNED NOT NULL,
  order_item_id            INT UNSIGNED NULL,
  payment_transaction_id   INT UNSIGNED NOT NULL,
  return_id                INT UNSIGNED NULL,
  amount                   DECIMAL(12,2) NOT NULL,
  status                   ENUM('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  reason                   VARCHAR(255) NULL,
  processed_by             INT UNSIGNED NULL,
  processed_at             DATETIME NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_refunds_seller_order (seller_order_id),
  CONSTRAINT fk_refunds_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_refunds_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
  CONSTRAINT fk_refunds_payment_transaction FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_refunds_return FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- COMMISSION & SETTLEMENT
-- ============================================================

CREATE TABLE commission_rules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope       ENUM('GLOBAL','CATEGORY','SELLER','PRODUCT') NOT NULL,
  scope_id    INT UNSIGNED NULL,
  type        ENUM('PERCENTAGE','FIXED') NOT NULL,
  value       DECIMAL(12,2) NOT NULL,
  priority    INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_commission_rules_scope (scope, scope_id)
) ENGINE=InnoDB;

CREATE TABLE seller_settlements (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id          INT UNSIGNED NOT NULL,
  period_start       DATE NOT NULL,
  period_end         DATE NOT NULL,
  gross_sales        DECIMAL(14,2) NOT NULL DEFAULT 0,
  commission_amount  DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount         DECIMAL(14,2) NOT NULL DEFAULT 0,
  shipping_charges   DECIMAL(14,2) NOT NULL DEFAULT 0,
  refund_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_payable        DECIMAL(14,2) NOT NULL DEFAULT 0,
  status             ENUM('PENDING','PROCESSING','PAID','FAILED','ON_HOLD') NOT NULL DEFAULT 'PENDING',
  paid_at            DATETIME NULL,
  paid_by            INT UNSIGNED NULL,
  reference_no       VARCHAR(60) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_seller_settlements_seller (seller_id),
  CONSTRAINT fk_seller_settlements_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE settlement_items (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  settlement_id    INT UNSIGNED NOT NULL,
  seller_order_id  INT UNSIGNED NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  KEY idx_settlement_items_settlement (settlement_id),
  CONSTRAINT fk_settlement_items_settlement FOREIGN KEY (settlement_id) REFERENCES seller_settlements(id) ON DELETE CASCADE,
  CONSTRAINT fk_settlement_items_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CMS & NOTIFICATIONS
-- ============================================================

CREATE TABLE banners (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  image       VARCHAR(255) NOT NULL,
  link        VARCHAR(255) NULL,
  position    VARCHAR(50) NOT NULL DEFAULT 'HOME_HERO',
  sort_order  INT NOT NULL DEFAULT 0,
  starts_at   DATETIME NULL,
  ends_at     DATETIME NULL,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE cms_sections (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_key    VARCHAR(60) NOT NULL DEFAULT 'HOME',
  section_type VARCHAR(60) NOT NULL,
  config      JSON NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  KEY idx_cms_sections_page (page_key)
) ENGINE=InnoDB;

CREATE TABLE cms_pages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug       VARCHAR(100) NOT NULL,
  title      VARCHAR(150) NOT NULL,
  content    LONGTEXT NULL,
  status     ENUM('PUBLISHED','DRAFT') NOT NULL DEFAULT 'DRAFT',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cms_pages_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE notification_templates (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(80) NOT NULL,
  channel         ENUM('IN_APP','EMAIL','SMS','WHATSAPP') NOT NULL,
  subject         VARCHAR(200) NULL,
  body_template   TEXT NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_notification_templates_code_channel (code, channel)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  template_code  VARCHAR(80) NOT NULL,
  channel        ENUM('IN_APP','EMAIL','SMS','WHATSAPP') NOT NULL,
  payload        JSON NULL,
  status         ENUM('PENDING','SENT','FAILED','READ') NOT NULL DEFAULT 'PENDING',
  sent_at        DATETIME NULL,
  read_at        DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================

CREATE TABLE settings (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group`      VARCHAR(60) NOT NULL,
  `key`        VARCHAR(100) NOT NULL,
  value        TEXT NULL,
  value_type   ENUM('STRING','NUMBER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING',
  updated_by   INT UNSIGNED NULL,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_settings_group_key (`group`, `key`)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
