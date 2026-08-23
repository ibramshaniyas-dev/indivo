const db = require('../config/database');

async function getOrCreateCart(customerId, executor = db) {
  const existing = await executor.queryOne('SELECT id FROM carts WHERE customer_id = :customerId', { customerId });
  if (existing) return existing.id;
  const result = await executor.query('INSERT INTO carts (customer_id) VALUES (:customerId)', { customerId });
  return result.insertId;
}

/**
 * Loads the cart with LIVE prices/stock/status joined fresh from products/variants/inventory —
 * never trusts `price_snapshot` for totals. Used by both the cart API (so the UI can warn about
 * price/stock changes) and checkout (which re-validates against this same source of truth before
 * ever creating an order).
 */
async function getCartSummary(customerId) {
  const cart = await db.queryOne('SELECT id FROM carts WHERE customer_id = :customerId', { customerId });
  if (!cart) return { cartId: null, items: [], sellerGroups: [], subtotal: 0, itemCount: 0, hasIssues: false };

  const rows = await db.query(
    `SELECT ci.id, ci.product_variant_id, ci.quantity, ci.price_snapshot, ci.seller_id,
            p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.status AS product_status,
            v.price AS current_price, v.mrp AS current_mrp, v.status AS variant_status,
            s.display_name AS seller_name, s.status AS seller_status,
            (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) AS image,
            COALESCE((SELECT SUM(i.available_stock - i.reserved_stock) FROM inventories i WHERE i.product_variant_id = v.id), 0) AS available_stock
     FROM cart_items ci
     JOIN product_variants v ON v.id = ci.product_variant_id
     JOIN products p ON p.id = v.product_id
     JOIN sellers s ON s.id = ci.seller_id
     WHERE ci.cart_id = :cartId
     ORDER BY ci.created_at ASC`,
    { cartId: cart.id }
  );

  const attrRows = rows.length
    ? await db.query(
        `SELECT pva.variant_id, a.name AS attribute_name, av.value
         FROM product_variant_attributes pva
         JOIN attributes a ON a.id = pva.attribute_id
         JOIN attribute_values av ON av.id = pva.attribute_value_id
         WHERE pva.variant_id IN (:variantIds)`,
        { variantIds: rows.map((r) => r.product_variant_id) }
      )
    : [];

  let subtotal = 0;
  let hasIssues = false;
  const items = rows.map((r) => {
    const available = r.product_status === 'ACTIVE' && r.seller_status === 'APPROVED'
      && r.variant_status === 'ACTIVE' && Number(r.available_stock) >= r.quantity;
    if (!available) hasIssues = true;
    const priceChanged = Number(r.current_price) !== Number(r.price_snapshot);
    if (priceChanged) hasIssues = true;
    const lineTotal = Number(r.current_price) * r.quantity;
    subtotal += lineTotal;
    return {
      id: r.id,
      productVariantId: r.product_variant_id,
      productId: r.product_id,
      productSlug: r.product_slug,
      productName: r.product_name,
      image: r.image,
      sellerId: r.seller_id,
      sellerName: r.seller_name,
      attributes: attrRows.filter((a) => a.variant_id === r.product_variant_id).map((a) => ({ name: a.attribute_name, value: a.value })),
      quantity: r.quantity,
      price: Number(r.current_price),
      mrp: Number(r.current_mrp),
      priceChanged,
      available,
      availableStock: Number(r.available_stock),
      lineTotal,
    };
  });

  const sellerGroups = Object.values(
    items.reduce((acc, item) => {
      (acc[item.sellerId] ||= { sellerId: item.sellerId, sellerName: item.sellerName, items: [], subtotal: 0 });
      acc[item.sellerId].items.push(item);
      acc[item.sellerId].subtotal += item.lineTotal;
      return acc;
    }, {})
  );

  return {
    cartId: cart.id,
    items,
    sellerGroups,
    subtotal,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    hasIssues,
  };
}

module.exports = { getOrCreateCart, getCartSummary };
