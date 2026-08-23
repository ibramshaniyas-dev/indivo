const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const attributes = await db.query("SELECT * FROM attributes WHERE status = 'ACTIVE' ORDER BY name ASC");
    const values = await db.query('SELECT * FROM attribute_values ORDER BY sort_order ASC, value ASC');
    const byAttribute = values.reduce((acc, v) => {
      (acc[v.attribute_id] ||= []).push(v);
      return acc;
    }, {});
    return success(res, {
      data: attributes.map((attr) => ({ ...attr, values: byAttribute[attr.id] || [] })),
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, inputType } = req.body;
    const result = await db.query('INSERT INTO attributes (name, input_type) VALUES (:name, :inputType)', {
      name,
      inputType: inputType || 'SELECT',
    });
    const attribute = await db.queryOne('SELECT * FROM attributes WHERE id = :id', { id: result.insertId });
    return success(res, { status: 201, message: 'Attribute created', data: attribute });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT id FROM attributes WHERE id = :id', { id: req.params.id });
    if (!existing) throw ApiError.notFound('Attribute not found');
    await db.query('DELETE FROM attributes WHERE id = :id', { id: req.params.id });
    return success(res, { message: 'Attribute deleted' });
  } catch (err) {
    return next(err);
  }
}

async function addValue(req, res, next) {
  try {
    const attribute = await db.queryOne('SELECT id FROM attributes WHERE id = :id', { id: req.params.id });
    if (!attribute) throw ApiError.notFound('Attribute not found');
    const result = await db.query(
      'INSERT INTO attribute_values (attribute_id, value, sort_order) VALUES (:attributeId, :value, :sortOrder)',
      { attributeId: attribute.id, value: req.body.value, sortOrder: req.body.sortOrder || 0 }
    );
    const value = await db.queryOne('SELECT * FROM attribute_values WHERE id = :id', { id: result.insertId });
    return success(res, { status: 201, message: 'Attribute value added', data: value });
  } catch (err) {
    return next(err);
  }
}

async function removeValue(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT id FROM attribute_values WHERE id = :id AND attribute_id = :attributeId', {
      id: req.params.valueId,
      attributeId: req.params.id,
    });
    if (!existing) throw ApiError.notFound('Attribute value not found');
    await db.query('DELETE FROM attribute_values WHERE id = :id', { id: req.params.valueId });
    return success(res, { message: 'Attribute value deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, remove, addValue, removeValue };
