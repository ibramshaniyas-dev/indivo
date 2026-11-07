-- Seller payouts: link each sub-order to the settlement (payout) that paid it, so "ready for
-- payout" vs "paid" can be tracked per order. Additive only — safe on a database with real data.

ALTER TABLE seller_orders
  ADD COLUMN settlement_id INT UNSIGNED NULL AFTER seller_payable,
  ADD KEY idx_seller_orders_settlement (settlement_id);

ALTER TABLE seller_settlements
  ADD COLUMN orders_count INT NOT NULL DEFAULT 0 AFTER period_end,
  ADD COLUMN notes VARCHAR(255) NULL AFTER reference_no;
