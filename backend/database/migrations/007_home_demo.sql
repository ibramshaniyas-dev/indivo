-- Home demo ("try at home within 1 hour"): Super Admin defines demo locations as a map pin +
-- radius, assigns demo pieces (products) to each location, and customers inside a location can
-- book a SEESHAA executive to bring the piece home. A purchase is handed over on the spot and
-- recorded as a normal order (Delivered + Paid). Additive only.

CREATE TABLE demo_zones (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  city          VARCHAR(100) NULL,
  latitude      DECIMAL(10,7) NOT NULL,
  longitude     DECIMAL(10,7) NOT NULL,
  radius_km     DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  sla_minutes   INT NOT NULL DEFAULT 60,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE demo_zone_products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  zone_id       INT UNSIGNED NOT NULL,
  product_id    INT UNSIGNED NOT NULL,
  pieces        INT NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_demo_zone_products (zone_id, product_id),
  KEY idx_demo_zone_products_product (product_id),
  CONSTRAINT fk_demo_zone_products_zone FOREIGN KEY (zone_id) REFERENCES demo_zones(id) ON DELETE CASCADE,
  CONSTRAINT fk_demo_zone_products_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE demo_bookings (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_number      VARCHAR(30) NOT NULL,
  customer_id         INT UNSIGNED NOT NULL,
  zone_id             INT UNSIGNED NOT NULL,
  product_id          INT UNSIGNED NOT NULL,
  product_variant_id  INT UNSIGNED NOT NULL,
  name                VARCHAR(150) NOT NULL,
  mobile              VARCHAR(15) NOT NULL,
  address_line1       VARCHAR(255) NOT NULL,
  address_line2       VARCHAR(255) NULL,
  city                VARCHAR(100) NOT NULL,
  state               VARCHAR(100) NOT NULL,
  pincode             VARCHAR(10) NOT NULL,
  latitude            DECIMAL(10,7) NOT NULL,
  longitude           DECIMAL(10,7) NOT NULL,
  distance_km         DECIMAL(6,2) NOT NULL,
  notes               VARCHAR(255) NULL,
  status              ENUM('REQUESTED','CONFIRMED','ON_THE_WAY','PURCHASED','NOT_PURCHASED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  agent_name          VARCHAR(120) NULL,
  agent_phone         VARCHAR(15) NULL,
  payment_mode        ENUM('CASH','UPI','CARD') NULL,
  order_id            INT UNSIGNED NULL,
  cancel_reason       VARCHAR(255) NULL,
  confirmed_at        DATETIME NULL,
  dispatched_at       DATETIME NULL,
  completed_at        DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_demo_bookings_number (booking_number),
  KEY idx_demo_bookings_customer (customer_id),
  KEY idx_demo_bookings_zone_status (zone_id, status),
  CONSTRAINT fk_demo_bookings_zone FOREIGN KEY (zone_id) REFERENCES demo_zones(id),
  CONSTRAINT fk_demo_bookings_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
