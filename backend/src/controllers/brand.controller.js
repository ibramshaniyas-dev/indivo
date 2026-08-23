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
      excludeId ? 'SELECT id FROM brands WHERE slug = :slug AND id != :excludeId' : 'SELECT id FROM brands WHERE slug = :slug',
      { slug, excludeId }
    );
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function list(req, res, next) {
  try {
    const status = req.query.status || 'ACTIVE';
    const brands = status === 'ALL'
      ? await db.query('SELECT * FROM brands ORDER BY name ASC')
      : await db.query('SELECT * FROM brands WHERE status = :status ORDER BY name ASC', { status });
    return success(res, { data: brands });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const brand = await db.queryOne('SELECT * FROM brands WHERE id = :id', { id: req.params.id });
    if (!brand) throw ApiError.notFound('Brand not found');
    return success(res, { data: brand });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, description, website } = req.body;
    const slug = await uniqueSlug(name);
    const logo = req.file ? publicUrlFor(relativePathFromFile(req.file)) : null;

    const result = await db.query(
      `INSERT INTO brands (name, slug, logo, description, website) VALUES (:name, :slug, :logo, :description, :website)`,
      { name, slug, logo, description: description || null, website: website || null }
    );
    const brand = await db.queryOne('SELECT * FROM brands WHERE id = :id', { id: result.insertId });
    return success(res, { status: 201, message: 'Brand created', data: brand });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT * FROM brands WHERE id = :id', { id: req.params.id });
    if (!existing) throw ApiError.notFound('Brand not found');

    const { name, description, website, status } = req.body;
    const slug = name && name !== existing.name ? await uniqueSlug(name, existing.id) : existing.slug;
    const logo = req.file ? publicUrlFor(relativePathFromFile(req.file)) : existing.logo;

    await db.query(
      `UPDATE brands SET name = :name, slug = :slug, logo = :logo, description = :description,
       website = :website, status = :status WHERE id = :id`,
      {
        id: existing.id,
        name: name ?? existing.name,
        slug,
        logo,
        description: description ?? existing.description,
        website: website ?? existing.website,
        status: status ?? existing.status,
      }
    );
    const brand = await db.queryOne('SELECT * FROM brands WHERE id = :id', { id: existing.id });
    return success(res, { message: 'Brand updated', data: brand });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT id FROM brands WHERE id = :id', { id: req.params.id });
    if (!existing) throw ApiError.notFound('Brand not found');
    const { productCount } = await db.queryOne('SELECT COUNT(*) AS productCount FROM products WHERE brand_id = :id', {
      id: req.params.id,
    });
    if (Number(productCount) > 0) {
      throw ApiError.conflict('Cannot delete a brand that has products; deactivate it instead');
    }
    await db.query('DELETE FROM brands WHERE id = :id', { id: req.params.id });
    return success(res, { message: 'Brand deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById, create, update, remove };
