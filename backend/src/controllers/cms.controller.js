const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

async function getPage(req, res, next) {
  try {
    const page = await db.queryOne("SELECT slug, title, content, updated_at FROM cms_pages WHERE slug = :slug AND status = 'PUBLISHED'", {
      slug: req.params.slug,
    });
    if (!page) throw ApiError.notFound('Page not found');
    return success(res, { data: page });
  } catch (err) {
    return next(err);
  }
}

async function getBanners(req, res, next) {
  try {
    const banners = await db.query(
      `SELECT id, title, image, link FROM banners
       WHERE status = 'ACTIVE' AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY sort_order ASC`
    );
    return success(res, { data: banners });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPage, getBanners };
