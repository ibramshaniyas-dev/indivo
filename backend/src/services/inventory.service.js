const db = require('../config/database');

async function getOrCreateDefaultWarehouse(sellerId, tx = db) {
  const existing = await tx.queryOne(
    "SELECT id FROM warehouses WHERE seller_id = :sellerId AND is_default = 1 LIMIT 1",
    { sellerId }
  );
  if (existing) return existing.id;

  const result = await tx.query(
    "INSERT INTO warehouses (seller_id, name, is_default) VALUES (:sellerId, 'Default Warehouse', 1)",
    { sellerId }
  );
  return result.insertId;
}

async function createInventoryForVariant(variantId, sellerId, stock, tx = db) {
  const warehouseId = await getOrCreateDefaultWarehouse(sellerId, tx);
  const result = await tx.query(
    `INSERT INTO inventories (product_variant_id, warehouse_id, available_stock)
     VALUES (:variantId, :warehouseId, :stock)`,
    { variantId, warehouseId, stock: stock || 0 }
  );
  if (stock > 0) {
    await tx.query(
      `INSERT INTO inventory_transactions (inventory_id, type, quantity, reference_type, reference_id)
       VALUES (:inventoryId, 'PURCHASE', :stock, 'PRODUCT_CREATE', :variantId)`,
      { inventoryId: result.insertId, stock, variantId }
    );
  }
  return result.insertId;
}

module.exports = { getOrCreateDefaultWarehouse, createInventoryForVariant };
