const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { success } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const { status } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const where = status ? 'WHERE s.status = :status' : '';
    const params = status ? { status } : {};

    const sellers = await db.query(
      `SELECT s.id, s.public_id, s.company_name, s.display_name, s.status, s.created_at,
              u.mobile AS owner_mobile, u.email AS owner_email
       FROM sellers s
       JOIN seller_users su ON su.seller_id = s.id AND su.seller_role = 'OWNER'
       JOIN users u ON u.id = su.user_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM sellers s ${where}`, params);

    return success(res, { data: sellers, meta: { page, limit, total: Number(total) } });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const seller = await db.queryOne('SELECT * FROM sellers WHERE id = :id', { id: req.params.id });
    if (!seller) throw ApiError.notFound('Seller not found');

    const [address, documents, bank, owner] = await Promise.all([
      db.queryOne("SELECT * FROM seller_addresses WHERE seller_id = :id AND type = 'REGISTERED'", { id: seller.id }),
      db.query('SELECT id, doc_type, file_url, status, verified_at FROM seller_documents WHERE seller_id = :id', { id: seller.id }),
      db.queryOne(
        'SELECT account_holder_name, bank_name, account_number_last4, ifsc, branch FROM seller_bank_accounts WHERE seller_id = :id',
        { id: seller.id }
      ),
      db.queryOne(
        `SELECT u.mobile, u.email FROM seller_users su JOIN users u ON u.id = su.user_id
         WHERE su.seller_id = :id AND su.seller_role = 'OWNER'`,
        { id: seller.id }
      ),
    ]);

    return success(res, { data: { ...seller, address, documents, bank, owner } });
  } catch (err) {
    return next(err);
  }
}

async function approve(req, res, next) {
  try {
    const seller = await db.queryOne('SELECT * FROM sellers WHERE id = :id', { id: req.params.id });
    if (!seller) throw ApiError.notFound('Seller not found');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(seller.status)) {
      throw ApiError.conflict(`Cannot approve a seller in status ${seller.status}`);
    }
    await db.query(
      "UPDATE sellers SET status = 'APPROVED', approved_by = :adminId, approved_at = NOW(), rejection_reason = NULL WHERE id = :id",
      { id: seller.id, adminId: req.user.id }
    );
    return success(res, { message: 'Seller approved' });
  } catch (err) {
    return next(err);
  }
}

async function reject(req, res, next) {
  try {
    const seller = await db.queryOne('SELECT * FROM sellers WHERE id = :id', { id: req.params.id });
    if (!seller) throw ApiError.notFound('Seller not found');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(seller.status)) {
      throw ApiError.conflict(`Cannot reject a seller in status ${seller.status}`);
    }
    await db.query("UPDATE sellers SET status = 'REJECTED', rejection_reason = :reason WHERE id = :id", {
      id: seller.id,
      reason: req.body.reason,
    });
    return success(res, { message: 'Seller rejected' });
  } catch (err) {
    return next(err);
  }
}

function setStatus(status) {
  return async (req, res, next) => {
    try {
      const seller = await db.queryOne('SELECT id, status FROM sellers WHERE id = :id', { id: req.params.id });
      if (!seller) throw ApiError.notFound('Seller not found');
      await db.query('UPDATE sellers SET status = :status WHERE id = :id', { id: seller.id, status });
      return success(res, { message: `Seller ${status.toLowerCase()}` });
    } catch (err) {
      return next(err);
    }
  };
}

async function verifyDocument(req, res, next) {
  try {
    const document = await db.queryOne('SELECT * FROM seller_documents WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.docId,
      sellerId: req.params.id,
    });
    if (!document) throw ApiError.notFound('Document not found');
    await db.query('UPDATE seller_documents SET status = :status, verified_by = :adminId, verified_at = NOW() WHERE id = :id', {
      id: document.id,
      status: req.body.status,
      adminId: req.user.id,
    });
    return success(res, { message: 'Document status updated' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById, approve, reject, suspend: setStatus('SUSPENDED'), block: setStatus('BLOCKED'), activate: setStatus('APPROVED'), verifyDocument };
