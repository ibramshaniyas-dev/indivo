const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const slugify = require('../utils/slugify');
const { publicUrlFor, relativePathFromFile } = require('../services/storage.service');

async function uniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.queryOne(
      excludeId
        ? 'SELECT id FROM categories WHERE slug = :slug AND id != :excludeId'
        : 'SELECT id FROM categories WHERE slug = :slug',
      { slug, excludeId }
    );
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function list(req, res, next) {
  try {
    const { status, parentId } = req.query;
    const conditions = [];
    const params = {};
    if (status && status !== 'ALL') {
      conditions.push('status = :status');
      params.status = status;
    } else if (!status) {
      conditions.push("status = 'ACTIVE'");
    }
    if (parentId === 'null') {
      conditions.push('parent_id IS NULL');
    } else if (parentId) {
      conditions.push('parent_id = :parentId');
      params.parentId = parentId;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const categories = await db.query(
      `SELECT id, parent_id, name, slug, image, banner, sort_order, status
       FROM categories ${where} ORDER BY sort_order ASC, name ASC`,
      params
    );
    return success(res, { data: categories });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const category = await db.queryOne('SELECT * FROM categories WHERE id = :id', { id: req.params.id });
    if (!category) throw ApiError.notFound('Category not found');
    return success(res, { data: category });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, parentId, sortOrder } = req.body;
    const slug = await uniqueSlug(name);
    const image = req.files?.image?.[0] ? publicUrlFor(relativePathFromFile(req.files.image[0])) : null;
    const banner = req.files?.banner?.[0] ? publicUrlFor(relativePathFromFile(req.files.banner[0])) : null;

    const result = await db.query(
      `INSERT INTO categories (parent_id, name, slug, image, banner, sort_order)
       VALUES (:parentId, :name, :slug, :image, :banner, :sortOrder)`,
      { parentId: parentId || null, name, slug, image, banner, sortOrder: sortOrder || 0 }
    );
    const category = await db.queryOne('SELECT * FROM categories WHERE id = :id', { id: result.insertId });
    return success(res, { status: 201, message: 'Category created', data: category });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT * FROM categories WHERE id = :id', { id: req.params.id });
    if (!existing) throw ApiError.notFound('Category not found');

    const { name, parentId, sortOrder, status } = req.body;
    const slug = name && name !== existing.name ? await uniqueSlug(name, existing.id) : existing.slug;
    const image = req.files?.image?.[0] ? publicUrlFor(relativePathFromFile(req.files.image[0])) : existing.image;
    const banner = req.files?.banner?.[0] ? publicUrlFor(relativePathFromFile(req.files.banner[0])) : existing.banner;

    await db.query(
      `UPDATE categories SET name = :name, slug = :slug, parent_id = :parentId, image = :image,
       banner = :banner, sort_order = :sortOrder, status = :status WHERE id = :id`,
      {
        id: existing.id,
        name: name ?? existing.name,
        slug,
        parentId: parentId !== undefined ? parentId || null : existing.parent_id,
        image,
        banner,
        sortOrder: sortOrder ?? existing.sort_order,
        status: status ?? existing.status,
      }
    );
    const category = await db.queryOne('SELECT * FROM categories WHERE id = :id', { id: existing.id });
    return success(res, { message: 'Category updated', data: category });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT id FROM categories WHERE id = :id', { id: req.params.id });
    if (!existing) throw ApiError.notFound('Category not found');
    const childOrProduct = await db.queryOne(
      `SELECT
         (SELECT COUNT(*) FROM categories WHERE parent_id = :id) AS childCount,
         (SELECT COUNT(*) FROM products WHERE category_id = :id) AS productCount`,
      { id: req.params.id }
    );
    if (Number(childOrProduct.childCount) > 0 || Number(childOrProduct.productCount) > 0) {
      throw ApiError.conflict('Cannot delete a category that has subcategories or products; deactivate it instead');
    }
    await db.query('DELETE FROM categories WHERE id = :id', { id: req.params.id });
    return success(res, { message: 'Category deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById, create, update, remove };
