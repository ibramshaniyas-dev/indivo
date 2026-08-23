-- Razorpay + Shiprocket + COD integration. Additive/extending — verified against live data
-- that no existing row uses a value being removed from any enum before running this.

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN payment_method ENUM('ONLINE','COD') NOT NULL DEFAULT 'COD' AFTER customer_id,
  ADD COLUMN cod_charge DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER shipping_charge;

ALTER TABLE orders
  MODIFY COLUMN payment_status ENUM('CREATED','PENDING','AUTHORIZED','PAID','FAILED','CANCELLED','REFUNDED','PARTIAL_REFUND') NOT NULL DEFAULT 'PENDING';

-- ---------------------------------------------------------------------------
-- payment_transactions
-- ---------------------------------------------------------------------------
ALTER TABLE payment_transactions
  ADD COLUMN razorpay_order_id VARCHAR(100) NULL AFTER gateway_txn_id,
  ADD COLUMN razorpay_payment_id VARCHAR(100) NULL AFTER razorpay_order_id,
  ADD COLUMN razorpay_signature VARCHAR(255) NULL AFTER razorpay_payment_id,
  ADD COLUMN failure_reason VARCHAR(255) NULL AFTER status,
  ADD KEY idx_payment_transactions_razorpay_order (razorpay_order_id);

ALTER TABLE payment_transactions
  MODIFY COLUMN status ENUM('CREATED','PENDING','AUTHORIZED','PAID','FAILED','CANCELLED','REFUNDED','PARTIAL_REFUND') NOT NULL DEFAULT 'PENDING';

-- ---------------------------------------------------------------------------
-- shipments — superset enum keeps the existing manual-entry values (SHIPPED, FAILED)
-- working alongside the new Shiprocket-driven granular lifecycle.
-- ---------------------------------------------------------------------------
ALTER TABLE shipments
  ADD COLUMN shiprocket_order_id VARCHAR(50) NULL AFTER seller_order_id,
  ADD COLUMN shiprocket_shipment_id VARCHAR(50) NULL AFTER shiprocket_order_id,
  ADD COLUMN courier_id VARCHAR(50) NULL AFTER courier_name,
  ADD COLUMN tracking_url VARCHAR(255) NULL AFTER tracking_number,
  ADD COLUMN cod_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER charge,
  ADD COLUMN label_url VARCHAR(255) NULL AFTER tracking_url,
  ADD COLUMN pickup_date DATE NULL AFTER estimated_delivery,
  ADD COLUMN shipped_date DATE NULL AFTER pickup_date,
  ADD COLUMN delivered_date DATE NULL AFTER shipped_date,
  ADD COLUMN rto_date DATE NULL AFTER delivered_date,
  ADD COLUMN rto_reason VARCHAR(255) NULL AFTER rto_date,
  ADD KEY idx_shipments_shiprocket_order (shiprocket_order_id);

ALTER TABLE shipments
  MODIFY COLUMN status ENUM(
    'PENDING','SHIPMENT_CREATED','AWB_ASSIGNED','PICKUP_REQUESTED','PICKED_UP','SHIPPED',
    'IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','FAILED',
    'RTO_INITIATED','RTO_IN_TRANSIT','RTO_DELIVERED'
  ) NOT NULL DEFAULT 'PENDING';

-- ---------------------------------------------------------------------------
-- refunds
-- ---------------------------------------------------------------------------
ALTER TABLE refunds
  ADD COLUMN razorpay_refund_id VARCHAR(100) NULL AFTER payment_transaction_id;

-- ---------------------------------------------------------------------------
-- cod_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE cod_transactions (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_order_id    INT UNSIGNED NOT NULL,
  cod_amount         DECIMAL(12,2) NOT NULL,
  cod_charges        DECIMAL(12,2) NOT NULL DEFAULT 0,
  courier_charge     DECIMAL(12,2) NOT NULL DEFAULT 0,
  remittance_amount  DECIMAL(12,2) NULL,
  status             ENUM('COD_PENDING','COD_CONFIRMED','COD_COLLECTED','COD_REMITTED','COD_SETTLEMENT_PENDING','COD_SETTLED','COD_FAILED','COD_RTO') NOT NULL DEFAULT 'COD_PENDING',
  collected_at       DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cod_transactions_seller_order (seller_order_id),
  CONSTRAINT fk_cod_transactions_seller_order FOREIGN KEY (seller_order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- cod_remittances (+ join table, one remittance batch covers many orders)
-- ---------------------------------------------------------------------------
CREATE TABLE cod_remittances (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  courier_name           VARCHAR(100) NOT NULL,
  remittance_reference   VARCHAR(100) NULL,
  total_amount           DECIMAL(14,2) NOT NULL DEFAULT 0,
  remittance_date        DATE NULL,
  status                 ENUM('EXPECTED','PENDING','SETTLED','PARTIAL','FAILED') NOT NULL DEFAULT 'EXPECTED',
  raw_response           JSON NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE cod_remittance_items (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  remittance_id       INT UNSIGNED NOT NULL,
  cod_transaction_id  INT UNSIGNED NOT NULL,
  amount              DECIMAL(12,2) NOT NULL,
  KEY idx_cod_remittance_items_remittance (remittance_id),
  CONSTRAINT fk_cod_remittance_items_remittance FOREIGN KEY (remittance_id) REFERENCES cod_remittances(id) ON DELETE CASCADE,
  CONSTRAINT fk_cod_remittance_items_transaction FOREIGN KEY (cod_transaction_id) REFERENCES cod_transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- webhook_events — idempotency guarantee for Razorpay + Shiprocket webhook replay/retry
-- ---------------------------------------------------------------------------
CREATE TABLE webhook_events (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source              ENUM('RAZORPAY','SHIPROCKET') NOT NULL,
  event_type          VARCHAR(60) NOT NULL,
  external_event_id   VARCHAR(150) NOT NULL,
  payload             JSON NULL,
  status              ENUM('RECEIVED','PROCESSED','FAILED','DUPLICATE') NOT NULL DEFAULT 'RECEIVED',
  processed_at        DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_webhook_events_source_external_id (source, external_event_id)
) ENGINE=InnoDB;

-- Register Razorpay as a payment gateway
INSERT INTO payment_gateways (code, name, is_active)
VALUES ('razorpay', 'Razorpay', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
