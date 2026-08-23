const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { success } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = {};
    if (req.query.status) {
      conditions.push('o.status = :status');
      params.status = req.query.status;
    }
    if (req.query.search) {
      conditions.push('(o.order_number LIKE :search OR c.name LIKE :search)');
      params.search = `%${req.query.search}%`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const orders = await db.query(
      `SELECT o.id, o.order_number, o.grand_total, o.payment_status, o.status, o.placed_at, c.name AS customer_name,
              (SELECT COUNT(*) FROM seller_orders so WHERE so.order_id = o.id) AS seller_order_count
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ${where} ORDER BY o.placed_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM orders o JOIN customers c ON c.id = o.customer_id ${where}`, params);

    return success(res, { data: orders, meta: { page, limit, total: Number(total) } });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const order = await db.queryOne(
      `SELECT o.*, c.name AS customer_name, u.mobile AS customer_mobile
       FROM orders o JOIN customers c ON c.id = o.customer_id JOIN users u ON u.id = c.user_id
       WHERE o.id = :id`,
      { id: req.params.id }
    );
    if (!order) throw ApiError.notFound('Order not found');

    const sellerOrders = await db.query(
      `SELECT so.*, s.display_name AS seller_name FROM seller_orders so JOIN sellers s ON s.id = so.seller_id WHERE so.order_id = :orderId`,
      { orderId: order.id }
    );
    for (const so of sellerOrders) {
      so.items = await db.query('SELECT * FROM order_items WHERE seller_order_id = :id', { id: so.id });
    }
    const payments = await db.query('SELECT * FROM payment_transactions WHERE order_id = :orderId', { orderId: order.id });

    return success(res, { data: { ...order, sellerOrders, payments } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById };
