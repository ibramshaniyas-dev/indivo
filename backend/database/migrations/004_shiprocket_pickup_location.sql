-- Tracks the Shiprocket "pickup_location" nickname once a seller's address has been registered
-- with Shiprocket (POST /settings/company/addpickup), so we register it once, not on every order.
ALTER TABLE sellers ADD COLUMN shiprocket_pickup_location VARCHAR(100) NULL AFTER business_category;
