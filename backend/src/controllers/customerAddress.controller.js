const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const addresses = await db.query(
      'SELECT * FROM customer_addresses WHERE customer_id = :customerId ORDER BY is_default DESC, created_at DESC',
      { customerId: req.user.customerId }
    );
    return success(res, { data: addresses });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, mobile, addressLine1, addressLine2, city, district, state, pincode, landmark, type, isDefault } = req.body;

    const existingCount = await db.queryOne('SELECT COUNT(*) AS count FROM customer_addresses WHERE customer_id = :customerId', {
      customerId: req.user.customerId,
    });
    const makeDefault = isDefault || Number(existingCount.count) === 0;

    await db.transaction(async (tx) => {
      if (makeDefault) {
        await tx.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = :customerId', {
          customerId: req.user.customerId,
        });
      }
      await tx.query(
        `INSERT INTO customer_addresses (customer_id, name, mobile, address_line1, address_line2, city, district, state, pincode, landmark, type, is_default)
         VALUES (:customerId, :name, :mobile, :addressLine1, :addressLine2, :city, :district, :state, :pincode, :landmark, :type, :isDefault)`,
        {
          customerId: req.user.customerId, name, mobile, addressLine1, addressLine2: addressLine2 || null,
          city, district: district || null, state, pincode, landmark: landmark || null,
          type: type || 'HOME', isDefault: makeDefault ? 1 : 0,
        }
      );
    });

    return success(res, { status: 201, message: 'Address saved' });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const address = await db.queryOne('SELECT id FROM customer_addresses WHERE id = :id AND customer_id = :customerId', {
      id: req.params.id,
      customerId: req.user.customerId,
    });
    if (!address) throw ApiError.notFound('Address not found');
    await db.query('DELETE FROM customer_addresses WHERE id = :id', { id: address.id });
    return success(res, { message: 'Address removed' });
  } catch (err) {
    return next(err);
  }
}

async function setDefault(req, res, next) {
  try {
    const address = await db.queryOne('SELECT id FROM customer_addresses WHERE id = :id AND customer_id = :customerId', {
      id: req.params.id,
      customerId: req.user.customerId,
    });
    if (!address) throw ApiError.notFound('Address not found');
    await db.transaction(async (tx) => {
      await tx.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = :customerId', {
        customerId: req.user.customerId,
      });
      await tx.query('UPDATE customer_addresses SET is_default = 1 WHERE id = :id', { id: address.id });
    });
    return success(res, { message: 'Default address updated' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, remove, setDefault };
