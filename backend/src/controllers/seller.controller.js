const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { signAccessToken, signRefreshToken } = require('../utils/token');
const { sha256 } = require('../utils/hash');
const { encrypt } = require('../utils/crypto');
const { publicUrlFor, relativePathFromFile } = require('../services/storage.service');

const AGREEMENT_VERSION = '1.0';

async function getStore(req, res, next) {
  try {
    const seller = await db.queryOne(
      "SELECT id, public_id, display_name, business_category, created_at FROM sellers WHERE id = :id AND status = 'APPROVED'",
      { id: req.params.id }
    );
    if (!seller) throw ApiError.notFound('Seller not found');

    const address = await db.queryOne(
      "SELECT city, state FROM seller_addresses WHERE seller_id = :id AND type = 'REGISTERED' LIMIT 1",
      { id: seller.id }
    );
    const stats = await db.queryOne(
      `SELECT COUNT(*) AS productCount,
              (SELECT ROUND(AVG(r.rating), 1) FROM reviews r
                 JOIN products p2 ON p2.id = r.product_id WHERE p2.seller_id = :id AND r.status = 'APPROVED') AS rating
       FROM products WHERE seller_id = :id AND status = 'ACTIVE'`,
      { id: seller.id }
    );

    return success(res, {
      data: {
        ...seller,
        city: address?.city || null,
        state: address?.state || null,
        productCount: Number(stats.productCount),
        rating: Number(stats.rating) || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const { companyName, displayName, businessCategory, contactPerson, mobile, email, password } = req.body;

    const existing = await db.queryOne('SELECT id FROM users WHERE mobile = :mobile', { mobile });
    if (existing) throw ApiError.conflict('This mobile number is already registered');

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

    const seller = await db.transaction(async (tx) => {
      const userResult = await tx.query(
        `INSERT INTO users (mobile, email, password_hash, user_type, status)
         VALUES (:mobile, :email, :passwordHash, 'SELLER_STAFF', 'ACTIVE')`,
        { mobile, email: email || null, passwordHash }
      );
      const userId = userResult.insertId;

      const sellerResult = await tx.query(
        `INSERT INTO sellers (public_id, company_name, display_name, business_category, contact_person, status)
         VALUES (:publicId, :companyName, :displayName, :businessCategory, :contactPerson, 'DRAFT')`,
        { publicId: uuidv4(), companyName, displayName, businessCategory: businessCategory || null, contactPerson }
      );
      const sellerId = sellerResult.insertId;

      await tx.query(
        `INSERT INTO seller_users (user_id, seller_id, seller_role, status) VALUES (:userId, :sellerId, 'OWNER', 'ACTIVE')`,
        { userId, sellerId }
      );

      return { id: sellerId, userId, mobile, email: email || null };
    });

    const tokenUser = { id: seller.userId, user_type: 'SELLER_STAFF' };
    const accessToken = signAccessToken(tokenUser);
    const refreshToken = signRefreshToken(tokenUser);
    await db.query('UPDATE users SET refresh_token_hash = :hash WHERE id = :id', {
      hash: sha256(refreshToken),
      id: seller.userId,
    });

    return success(res, {
      status: 201,
      message: 'Seller account created. Continue onboarding to submit for approval.',
      data: {
        user: { id: seller.userId, mobile, email: seller.email, userType: 'SELLER_STAFF', sellerId: seller.id, sellerRole: 'OWNER' },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const seller = await db.queryOne('SELECT * FROM sellers WHERE id = :id', { id: req.sellerId });
    const address = await db.queryOne(
      "SELECT * FROM seller_addresses WHERE seller_id = :id AND type = 'REGISTERED' LIMIT 1",
      { id: req.sellerId }
    );
    const documents = await db.query(
      'SELECT id, doc_type, file_url, status, created_at FROM seller_documents WHERE seller_id = :id',
      { id: req.sellerId }
    );
    const bank = await db.queryOne(
      'SELECT account_holder_name, bank_name, account_number_last4, ifsc, branch FROM seller_bank_accounts WHERE seller_id = :id',
      { id: req.sellerId }
    );
    return success(res, { data: { ...seller, address, documents, bank } });
  } catch (err) {
    return next(err);
  }
}

async function updateBusiness(req, res, next) {
  try {
    const { legalName, gstNo, panNo, businessRegNo, addressLine1, addressLine2, city, district, state, pincode } = req.body;

    await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE sellers SET legal_name = :legalName, gst_no = :gstNo, pan_no = :panNo, business_reg_no = :businessRegNo
         WHERE id = :id`,
        { id: req.sellerId, legalName: legalName || null, gstNo: gstNo || null, panNo: panNo || null, businessRegNo: businessRegNo || null }
      );

      const existingAddress = await tx.queryOne(
        "SELECT id FROM seller_addresses WHERE seller_id = :id AND type = 'REGISTERED' LIMIT 1",
        { id: req.sellerId }
      );
      if (existingAddress) {
        await tx.query(
          `UPDATE seller_addresses SET address_line1 = :addressLine1, address_line2 = :addressLine2, city = :city,
           district = :district, state = :state, pincode = :pincode WHERE id = :id`,
          { id: existingAddress.id, addressLine1, addressLine2: addressLine2 || null, city, district: district || null, state, pincode }
        );
      } else {
        await tx.query(
          `INSERT INTO seller_addresses (seller_id, type, address_line1, address_line2, city, district, state, pincode)
           VALUES (:sellerId, 'REGISTERED', :addressLine1, :addressLine2, :city, :district, :state, :pincode)`,
          { sellerId: req.sellerId, addressLine1, addressLine2: addressLine2 || null, city, district: district || null, state, pincode }
        );
      }
    });

    return success(res, { message: 'Business information saved' });
  } catch (err) {
    return next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) throw ApiError.badRequest('A document file is required');
    const fileUrl = publicUrlFor(relativePathFromFile(req.file));
    const result = await db.query(
      `INSERT INTO seller_documents (seller_id, doc_type, file_url, status) VALUES (:sellerId, :docType, :fileUrl, 'PENDING')`,
      { sellerId: req.sellerId, docType: req.body.docType, fileUrl }
    );
    const document = await db.queryOne('SELECT * FROM seller_documents WHERE id = :id', { id: result.insertId });
    return success(res, { status: 201, message: 'Document uploaded', data: document });
  } catch (err) {
    return next(err);
  }
}

async function removeDocument(req, res, next) {
  try {
    const document = await db.queryOne('SELECT * FROM seller_documents WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.docId,
      sellerId: req.sellerId,
    });
    if (!document) throw ApiError.notFound('Document not found');
    if (document.status === 'VERIFIED') throw ApiError.conflict('Cannot remove a verified document');
    await db.query('DELETE FROM seller_documents WHERE id = :id', { id: document.id });
    return success(res, { message: 'Document removed' });
  } catch (err) {
    return next(err);
  }
}

async function updateBank(req, res, next) {
  try {
    const { accountHolderName, bankName, accountNumber, ifsc, branch } = req.body;
    const encrypted = encrypt(accountNumber);
    const last4 = accountNumber.slice(-4);

    const existing = await db.queryOne('SELECT id FROM seller_bank_accounts WHERE seller_id = :id', { id: req.sellerId });
    if (existing) {
      await db.query(
        `UPDATE seller_bank_accounts SET account_holder_name = :accountHolderName, bank_name = :bankName,
         account_number_enc = :encrypted, account_number_last4 = :last4, ifsc = :ifsc, branch = :branch
         WHERE seller_id = :sellerId`,
        { sellerId: req.sellerId, accountHolderName, bankName, encrypted, last4, ifsc, branch: branch || null }
      );
    } else {
      await db.query(
        `INSERT INTO seller_bank_accounts (seller_id, account_holder_name, bank_name, account_number_enc, account_number_last4, ifsc, branch)
         VALUES (:sellerId, :accountHolderName, :bankName, :encrypted, :last4, :ifsc, :branch)`,
        { sellerId: req.sellerId, accountHolderName, bankName, encrypted, last4, ifsc, branch: branch || null }
      );
    }
    return success(res, { message: 'Bank details saved' });
  } catch (err) {
    return next(err);
  }
}

async function acceptAgreement(req, res, next) {
  try {
    await db.query('UPDATE sellers SET agreement_accepted_at = NOW(), agreement_version = :version WHERE id = :id', {
      id: req.sellerId,
      version: AGREEMENT_VERSION,
    });
    return success(res, { message: 'Agreement accepted' });
  } catch (err) {
    return next(err);
  }
}

async function submit(req, res, next) {
  try {
    const seller = await db.queryOne('SELECT * FROM sellers WHERE id = :id', { id: req.sellerId });
    if (!['DRAFT', 'REJECTED'].includes(seller.status)) {
      throw ApiError.conflict(`Cannot submit a seller application in status ${seller.status}`);
    }

    const address = await db.queryOne(
      "SELECT id FROM seller_addresses WHERE seller_id = :id AND type = 'REGISTERED'",
      { id: req.sellerId }
    );
    const bank = await db.queryOne('SELECT id FROM seller_bank_accounts WHERE seller_id = :id', { id: req.sellerId });
    const documentCount = await db.queryOne(
      "SELECT COUNT(*) AS count FROM seller_documents WHERE seller_id = :id",
      { id: req.sellerId }
    );

    const missing = [];
    if (!address) missing.push('business address');
    if (!bank) missing.push('bank account');
    if (Number(documentCount.count) === 0) missing.push('at least one verification document');
    if (!seller.agreement_accepted_at) missing.push('marketplace agreement acceptance');
    if (missing.length) {
      throw ApiError.badRequest(`Cannot submit — missing: ${missing.join(', ')}`);
    }

    await db.query("UPDATE sellers SET status = 'SUBMITTED', rejection_reason = NULL WHERE id = :id", { id: req.sellerId });
    return success(res, { message: 'Application submitted for review' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  getMe,
  getStore,
  updateBusiness,
  uploadDocument,
  removeDocument,
  updateBank,
  acceptAgreement,
  submit,
};
