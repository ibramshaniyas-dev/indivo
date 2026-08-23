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
      conditions.push('p.status = :status');
      params.status = req.query.status;
    }
    if (req.query.seller) {
      conditions.push('p.seller_id = :sellerId');
      params.sellerId = req.query.seller;
    }
    if (req.query.search) {
      conditions.push('(p.name LIKE :search OR p.sku LIKE :search)');
      params.search = `%${req.query.search}%`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const products = await db.query(
      `SELECT p.id, p.name, p.sku, p.status, p.selling_price, p.mrp, p.created_at, p.is_featured,
              s.display_name AS seller_name, c.name AS category_name,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image
       FROM products p
       JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${where} ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM products p ${where}`, params);

    return success(res, { data: products, meta: { page, limit, total: Number(total) } });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await db.queryOne(
      `SELECT p.*, s.display_name AS seller_name, c.name AS category_name, b.name AS brand_name
       FROM products p JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id = :id`,
      { id: req.params.id }
    );
    if (!product) throw ApiError.notFound('Product not found');
    const [images, variants] = await Promise.all([
      db.query('SELECT * FROM product_images WHERE product_id = :id ORDER BY sort_order ASC', { id: product.id }),
      db.query('SELECT * FROM product_variants WHERE product_id = :id', { id: product.id }),
    ]);
    return success(res, { data: { ...product, images, variants } });
  } catch (err) {
    return next(err);
  }
}

async function approve(req, res, next) {
  try {
    const product = await db.queryOne('SELECT * FROM products WHERE id = :id', { id: req.params.id });
    if (!product) throw ApiError.notFound('Product not found');
    if (product.status !== 'PENDING_REVIEW') throw ApiError.conflict(`Cannot approve a product in status ${product.status}`);
    await db.query("UPDATE products SET status = 'ACTIVE', approved_by = :adminId, approved_at = NOW() WHERE id = :id", {
      id: product.id,
      adminId: req.user.id,
    });
    return success(res, { message: 'Product approved and is now live' });
  } catch (err) {
    return next(err);
  }
}

async function reject(req, res, next) {
  try {
    const product = await db.queryOne('SELECT * FROM products WHERE id = :id', { id: req.params.id });
    if (!product) throw ApiError.notFound('Product not found');
    if (product.status !== 'PENDING_REVIEW') throw ApiError.conflict(`Cannot reject a product in status ${product.status}`);
    await db.query("UPDATE products SET status = 'REJECTED' WHERE id = :id", { id: product.id });
    return success(res, { message: 'Product rejected', data: { reason: req.body.reason } });
  } catch (err) {
    return next(err);
  }
}

function setStatus(status) {
  return async (req, res, next) => {
    try {
      const product = await db.queryOne('SELECT id FROM products WHERE id = :id', { id: req.params.id });
      if (!product) throw ApiError.notFound('Product not found');
      await db.query('UPDATE products SET status = :status WHERE id = :id', { id: product.id, status });
      return success(res, { message: `Product ${status.toLowerCase()}` });
    } catch (err) {
      return next(err);
    }
  };
}

function setFlag(field) {
  return async (req, res, next) => {
    try {
      const product = await db.queryOne('SELECT id FROM products WHERE id = :id', { id: req.params.id });
      if (!product) throw ApiError.notFound('Product not found');
      await db.query(`UPDATE products SET ${field} = :value WHERE id = :id`, { id: product.id, value: req.body.value ? 1 : 0 });
      return success(res, { message: 'Product updated' });
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  list,
  getById,
  approve,
  reject,
  block: setStatus('BLOCKED'),
  deactivate: setStatus('INACTIVE'),
  setFeatured: setFlag('is_featured'),
  setBestseller: setFlag('is_bestseller'),
  setTrending: setFlag('is_trending'),
};
