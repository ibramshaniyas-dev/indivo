const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

// PLACED -> CONFIRMED -> PROCESSING -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED,
// with CANCELLED reachable up until PACKED. Enforced server-side — never trust the client
// to only send valid transitions.
const ALLOWED_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

async function refreshParentOrderStatus(orderId, tx = db) {
  const sellerOrders = await tx.query('SELECT status FROM seller_orders WHERE order_id = :orderId', { orderId });
  const statuses = sellerOrders.map((s) => s.status);
  let parentStatus = 'PLACED';
  if (statuses.every((s) => s === 'DELIVERED')) parentStatus = 'COMPLETED';
  else if (statuses.every((s) => s === 'CANCELLED')) parentStatus = 'CANCELLED';
  else if (statuses.some((s) => s !== 'PLACED')) parentStatus = statuses.some((s) => s === 'DELIVERED') ? 'PARTIALLY_FULFILLED' : 'CONFIRMED';
  await tx.query('UPDATE orders SET status = :status WHERE id = :orderId', { status: parentStatus, orderId });
}

async function listMine(req, res, next) {
  try {
    const conditions = ['so.seller_id = :sellerId'];
    const params = { sellerId: req.sellerId };
    if (req.query.status) {
      conditions.push('so.status = :status');
      params.status = req.query.status;
    }
    const orders = await db.query(
      `SELECT so.id, so.sub_order_number, so.status, so.subtotal, so.tax, so.shipping_charge, so.seller_payable, so.created_at,
              o.order_number, o.public_id AS order_public_id, c.name AS customer_name,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.seller_order_id = so.id) AS item_count
       FROM seller_orders so
       JOIN orders o ON o.id = so.order_id
       JOIN customers c ON c.id = o.customer_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY so.created_at DESC`,
      params
    );
    return success(res, { data: orders });
  } catch (err) {
    return next(err);
  }
}

async function getMineById(req, res, next) {
  try {
    const sellerOrder = await db.queryOne(
      `SELECT so.*, o.order_number, o.public_id AS order_public_id, o.shipping_name, o.shipping_mobile,
              o.shipping_address1, o.shipping_address2, o.shipping_city, o.shipping_state, o.shipping_pincode,
              c.name AS customer_name
       FROM seller_orders so
       JOIN orders o ON o.id = so.order_id
       JOIN customers c ON c.id = o.customer_id
       WHERE so.id = :id AND so.seller_id = :sellerId`,
      { id: req.params.id, sellerId: req.sellerId }
    );
    if (!sellerOrder) throw ApiError.notFound('Order not found');

    const items = await db.query('SELECT * FROM order_items WHERE seller_order_id = :id', { id: sellerOrder.id });
    const history = await db.query(
      'SELECT status, note, changed_at FROM order_status_history WHERE seller_order_id = :id ORDER BY changed_at ASC',
      { id: sellerOrder.id }
    );
    const shipment = await db.queryOne('SELECT * FROM shipments WHERE seller_order_id = :id', { id: sellerOrder.id });

    return success(res, { data: { ...sellerOrder, items, history, shipment } });
  } catch (err) {
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const sellerOrder = await db.queryOne('SELECT * FROM seller_orders WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.id,
      sellerId: req.sellerId,
    });
    if (!sellerOrder) throw ApiError.notFound('Order not found');

    const { status: nextStatus, trackingNumber, courierName, note } = req.body;
    const allowed = ALLOWED_TRANSITIONS[sellerOrder.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw ApiError.conflict(`Cannot move an order from ${sellerOrder.status} to ${nextStatus}`);
    }

    await db.transaction(async (tx) => {
      await tx.query('UPDATE seller_orders SET status = :status WHERE id = :id', { id: sellerOrder.id, status: nextStatus });
      await tx.query(
        'INSERT INTO order_status_history (seller_order_id, status, note, changed_by) VALUES (:id, :status, :note, :changedBy)',
        { id: sellerOrder.id, status: nextStatus, note: note || null, changedBy: req.user.id }
      );

      if (nextStatus === 'SHIPPED') {
        const existingShipment = await tx.queryOne('SELECT id FROM shipments WHERE seller_order_id = :id', { id: sellerOrder.id });
        if (existingShipment) {
          await tx.query(
            'UPDATE shipments SET courier_name = :courier, tracking_number = :tracking, status = :status WHERE id = :id',
            { id: existingShipment.id, courier: courierName || null, tracking: trackingNumber || null, status: 'SHIPPED' }
          );
        } else {
          await tx.query(
            `INSERT INTO shipments (seller_order_id, courier_name, tracking_number, status) VALUES (:id, :courier, :tracking, 'SHIPPED')`,
            { id: sellerOrder.id, courier: courierName || null, tracking: trackingNumber || null }
          );
        }
      } else if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(nextStatus)) {
        await tx.query('UPDATE shipments SET status = :status WHERE seller_order_id = :id', { id: sellerOrder.id, status: nextStatus });
      }

      await refreshParentOrderStatus(sellerOrder.order_id, tx);
    });

    return success(res, { message: `Order marked as ${nextStatus}` });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMine, getMineById, updateStatus };
