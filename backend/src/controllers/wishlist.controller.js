const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

async function getOrCreateWishlist(customerId) {
  const existing = await db.queryOne('SELECT id FROM wishlists WHERE customer_id = :customerId LIMIT 1', { customerId });
  if (existing) return existing.id;
  const result = await db.query("INSERT INTO wishlists (customer_id, name) VALUES (:customerId, 'My Wishlist')", { customerId });
  return result.insertId;
}

async function list(req, res, next) {
  try {
    const wishlistId = await getOrCreateWishlist(req.user.customerId);
    const items = await db.query(
      `SELECT wi.id AS wishlist_item_id, p.id, p.slug, p.name, p.selling_price AS price, p.mrp,
              s.display_name AS sellerName, s.id AS sellerId,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image,
              (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='APPROVED') AS rating,
              (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status='APPROVED') AS reviewCount,
              CASE WHEN COALESCE((SELECT SUM(i.available_stock - i.reserved_stock) FROM inventories i
                     JOIN product_variants v ON v.id = i.product_variant_id WHERE v.product_id = p.id), 0) > 0
                   THEN 'IN_STOCK' ELSE 'OUT_OF_STOCK' END AS stockStatus
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       JOIN sellers s ON s.id = p.seller_id
       WHERE wi.wishlist_id = :wishlistId
       ORDER BY wi.created_at DESC`,
      { wishlistId }
    );
    return success(res, { data: items });
  } catch (err) {
    return next(err);
  }
}

async function add(req, res, next) {
  try {
    const { productId } = req.body;
    const product = await db.queryOne('SELECT id FROM products WHERE id = :id', { id: productId });
    if (!product) throw ApiError.notFound('Product not found');

    const wishlistId = await getOrCreateWishlist(req.user.customerId);
    // Can't lean on the (wishlist_id, product_id, variant_id) unique key here — variant_id is
    // NULL for a plain product wishlist entry, and MySQL never treats two NULLs as equal for
    // uniqueness, so INSERT IGNORE would silently create a duplicate row every time. Same class
    // of bug as the earlier role-seeding issue — check existence explicitly instead.
    const existing = await db.queryOne(
      'SELECT id FROM wishlist_items WHERE wishlist_id = :wishlistId AND product_id = :productId AND variant_id IS NULL',
      { wishlistId, productId }
    );
    if (!existing) {
      await db.query(
        `INSERT INTO wishlist_items (wishlist_id, product_id, variant_id) VALUES (:wishlistId, :productId, NULL)`,
        { wishlistId, productId }
      );
    }
    return success(res, { status: 201, message: 'Added to wishlist' });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const wishlistId = await getOrCreateWishlist(req.user.customerId);
    await db.query('DELETE FROM wishlist_items WHERE wishlist_id = :wishlistId AND product_id = :productId', {
      wishlistId,
      productId: req.params.productId,
    });
    return success(res, { message: 'Removed from wishlist' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, add, remove };
