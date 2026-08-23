-- Adds a display name for ADMIN users (customers/sellers already have names via their own tables).
ALTER TABLE users ADD COLUMN name VARCHAR(150) NULL AFTER id;
