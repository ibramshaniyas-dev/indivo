const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

async function listMyOrders(req, res, next) {
  try {
    const orders = await db.query(
      `SELECT o.id, o.public_id, o.order_number, o.grand_total, o.payment_status, o.status, o.placed_at,
              (SELECT COUNT(*) FROM seller_orders so WHERE so.order_id = o.id) AS seller_order_count,
              (SELECT COUNT(*) FROM order_items oi JOIN seller_orders so ON so.id = oi.seller_order_id WHERE so.order_id = o.id) AS item_count
       FROM orders o WHERE o.customer_id = :customerId ORDER BY o.placed_at DESC`,
      { customerId: req.user.customerId }
    );
    return success(res, { data: orders });
  } catch (err) {
    return next(err);
  }
}

async function getMyOrder(req, res, next) {
  try {
    const order = await db.queryOne('SELECT * FROM orders WHERE id = :id AND customer_id = :customerId', {
      id: req.params.id,
      customerId: req.user.customerId,
    });
    if (!order) throw ApiError.notFound('Order not found');

    const sellerOrders = await db.query(
      `SELECT so.*, s.display_name AS seller_name FROM seller_orders so JOIN sellers s ON s.id = so.seller_id WHERE so.order_id = :orderId`,
      { orderId: order.id }
    );
    for (const so of sellerOrders) {
      so.items = await db.query('SELECT * FROM order_items WHERE seller_order_id = :id', { id: so.id });
      so.history = await db.query(
        'SELECT status, note, changed_at FROM order_status_history WHERE seller_order_id = :id ORDER BY changed_at ASC',
        { id: so.id }
      );
      so.shipment = await db.queryOne('SELECT * FROM shipments WHERE seller_order_id = :id', { id: so.id });
    }

    return success(res, { data: { ...order, sellerOrders } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMyOrders, getMyOrder };
