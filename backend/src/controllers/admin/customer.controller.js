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
      conditions.push('u.status = :status');
      params.status = req.query.status;
    }
    if (req.query.search) {
      conditions.push('(c.name LIKE :search OR u.mobile LIKE :search OR u.email LIKE :search)');
      params.search = `%${req.query.search}%`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const customers = await db.query(
      `SELECT c.id, c.name, c.gender, u.id AS user_id, u.mobile, u.email, u.status, u.created_at, u.last_login_at,
              (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count
       FROM customers c JOIN users u ON u.id = c.user_id
       ${where} ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM customers c JOIN users u ON u.id = c.user_id ${where}`,
      params
    );

    return success(res, { data: customers, meta: { page, limit, total: Number(total) } });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const customer = await db.queryOne(
      `SELECT c.*, u.mobile, u.email, u.status, u.created_at, u.last_login_at
       FROM customers c JOIN users u ON u.id = c.user_id WHERE c.id = :id`,
      { id: req.params.id }
    );
    if (!customer) throw ApiError.notFound('Customer not found');
    const addresses = await db.query('SELECT * FROM customer_addresses WHERE customer_id = :id', { id: customer.id });
    return success(res, { data: { ...customer, addresses } });
  } catch (err) {
    return next(err);
  }
}

function setStatus(status) {
  return async (req, res, next) => {
    try {
      const customer = await db.queryOne('SELECT user_id FROM customers WHERE id = :id', { id: req.params.id });
      if (!customer) throw ApiError.notFound('Customer not found');
      await db.query('UPDATE users SET status = :status WHERE id = :id', { id: customer.user_id, status });
      return success(res, { message: `Customer ${status.toLowerCase()}` });
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { list, getById, activate: setStatus('ACTIVE'), block: setStatus('BLOCKED'), deactivate: setStatus('INACTIVE') };
