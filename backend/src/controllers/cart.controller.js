const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { getOrCreateCart, getCartSummary } = require('../services/cart.service');

async function getCart(req, res, next) {
  try {
    const summary = await getCartSummary(req.user.customerId);
    return success(res, { data: summary });
  } catch (err) {
    return next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { productVariantId, quantity } = req.body;
    const qty = quantity || 1;

    const variant = await db.queryOne(
      `SELECT v.id, v.price, v.status AS variant_status, p.id AS product_id, p.seller_id, p.status AS product_status,
              s.status AS seller_status,
              COALESCE((SELECT SUM(i.available_stock - i.reserved_stock) FROM inventories i WHERE i.product_variant_id = v.id), 0) AS available_stock
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       JOIN sellers s ON s.id = p.seller_id
       WHERE v.id = :id`,
      { id: productVariantId }
    );
    if (!variant) throw ApiError.notFound('Product not found');
    if (variant.product_status !== 'ACTIVE' || variant.seller_status !== 'APPROVED' || variant.variant_status !== 'ACTIVE') {
      throw ApiError.conflict('This product is currently unavailable');
    }
    if (Number(variant.available_stock) < qty) {
      throw ApiError.conflict(`Only ${variant.available_stock} left in stock`);
    }

    const cartId = await getOrCreateCart(req.user.customerId);
    const existing = await db.queryOne('SELECT id, quantity FROM cart_items WHERE cart_id = :cartId AND product_variant_id = :variantId', {
      cartId,
      variantId: productVariantId,
    });

    if (existing) {
      const newQty = Math.min(existing.quantity + qty, 20);
      await db.query('UPDATE cart_items SET quantity = :qty, price_snapshot = :price WHERE id = :id', {
        id: existing.id,
        qty: newQty,
        price: variant.price,
      });
    } else {
      await db.query(
        `INSERT INTO cart_items (cart_id, product_variant_id, seller_id, quantity, price_snapshot)
         VALUES (:cartId, :variantId, :sellerId, :qty, :price)`,
        { cartId, variantId: productVariantId, sellerId: variant.seller_id, qty, price: variant.price }
      );
    }

    const summary = await getCartSummary(req.user.customerId);
    return success(res, { status: 201, message: 'Added to cart', data: summary });
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const cartId = await getOrCreateCart(req.user.customerId);
    const item = await db.queryOne('SELECT id FROM cart_items WHERE id = :id AND cart_id = :cartId', {
      id: req.params.itemId,
      cartId,
    });
    if (!item) throw ApiError.notFound('Cart item not found');
    await db.query('UPDATE cart_items SET quantity = :qty WHERE id = :id', { id: item.id, qty: req.body.quantity });
    const summary = await getCartSummary(req.user.customerId);
    return success(res, { message: 'Cart updated', data: summary });
  } catch (err) {
    return next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const cartId = await getOrCreateCart(req.user.customerId);
    await db.query('DELETE FROM cart_items WHERE id = :id AND cart_id = :cartId', { id: req.params.itemId, cartId });
    const summary = await getCartSummary(req.user.customerId);
    return success(res, { message: 'Item removed', data: summary });
  } catch (err) {
    return next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    const cartId = await getOrCreateCart(req.user.customerId);
    await db.query('DELETE FROM cart_items WHERE cart_id = :cartId', { cartId });
    return success(res, { message: 'Cart cleared' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
