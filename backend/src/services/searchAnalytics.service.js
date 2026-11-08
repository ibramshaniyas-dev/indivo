const crypto = require('crypto');
const db = require('../config/database');

// The same visitor re-running the same search within this window (changing filters, sorting,
// coming back to the results) is one search, not many.
const DEDUPE_MINUTES = 30;

/** "  Silk   SAREE " → "silk saree". Returns '' for terms too short to be meaningful. */
function normalizeTerm(term) {
  const t = String(term || '').toLowerCase().replace(/["'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
  return t.length >= 2 ? t : '';
}

/** Short one-way visitor fingerprint (IP + user agent). Not reversible, not personal data. */
function visitorKey(req) {
  const raw = `${req.ip || ''}|${req.get?.('user-agent') || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/** Records a search (deduplicated per visitor+term) and returns its id for click attribution. */
async function logSearch({ term, resultsCount, visitor, updateResults = true }) {
  const norm = normalizeTerm(term);
  if (!norm) return null;
  const existing = await db.queryOne(
    `SELECT id FROM search_logs WHERE visitor_key = :visitor AND term_norm = :norm
       AND created_at >= NOW() - INTERVAL ${DEDUPE_MINUTES} MINUTE ORDER BY id DESC LIMIT 1`,
    { visitor, norm }
  );
  if (existing) {
    if (updateResults) await db.query('UPDATE search_logs SET results_count = :resultsCount WHERE id = :id', { id: existing.id, resultsCount });
    return existing.id;
  }
  const result = await db.query(
    'INSERT INTO search_logs (term, term_norm, results_count, visitor_key) VALUES (:term, :norm, :resultsCount, :visitor)',
    { term: String(term).trim().slice(0, 200), norm, resultsCount, visitor }
  );
  return result.insertId;
}

/** Records that a product was opened from a search result list. Idempotent per search+product. */
async function logClick({ searchId, productId, position }) {
  const log = await db.queryOne('SELECT id, term_norm FROM search_logs WHERE id = :searchId', { searchId });
  if (!log) return false;
  const product = await db.queryOne('SELECT id FROM products WHERE id = :productId', { productId });
  if (!product) return false;
  await db.query(
    `INSERT IGNORE INTO search_clicks (search_log_id, term_norm, product_id, position)
     VALUES (:searchId, :term, :productId, :position)`,
    { searchId, term: log.term_norm, productId, position: Number.isInteger(position) && position > 0 ? Math.min(position, 65535) : null }
  );
  return true;
}

const pctChange = (now, before) => (before > 0 ? (now - before) / before : null);

/** Admin dashboard data for the last `days` days (today included). */
async function getInsights(days) {
  const range = { days: days - 1 };
  const from = 'CURDATE() - INTERVAL :days DAY';
  const prevFrom = `${from} - INTERVAL ${days} DAY`;

  const [[totals], [prev], [clickTotals], daily, topTerms, zeroTerms, topProducts, [{ today }]] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS searches, COUNT(DISTINCT term_norm) AS terms, COUNT(DISTINCT visitor_key) AS visitors,
              SUM(results_count = 0) AS zero
         FROM search_logs WHERE created_at >= ${from}`, range
    ),
    db.query(`SELECT COUNT(*) AS searches FROM search_logs WHERE created_at >= ${prevFrom} AND created_at < ${from}`, range),
    db.query(
      `SELECT COUNT(*) AS clicks, COUNT(DISTINCT c.search_log_id) AS clickedSearches
         FROM search_clicks c JOIN search_logs l ON l.id = c.search_log_id WHERE l.created_at >= ${from}`, range
    ),
    db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS searches FROM search_logs WHERE created_at >= ${from} GROUP BY DATE(created_at)`, range),
    db.query(
      `SELECT l.term_norm AS term, COUNT(*) AS searches, COUNT(DISTINCT l.visitor_key) AS visitors,
              ROUND(AVG(l.results_count)) AS avgResults, MAX(l.created_at) AS lastSearched,
              TIMESTAMPDIFF(MINUTE, MAX(l.created_at), NOW()) AS minutesAgo,
              COALESCE(SUM(cc.clicks), 0) AS clicks, SUM(cc.clicks > 0) AS clickedSearches
         FROM search_logs l
         LEFT JOIN (SELECT search_log_id, COUNT(*) AS clicks FROM search_clicks GROUP BY search_log_id) cc ON cc.search_log_id = l.id
        WHERE l.created_at >= ${from}
        GROUP BY l.term_norm ORDER BY searches DESC, lastSearched DESC LIMIT 30`, range
    ),
    db.query(
      `SELECT term_norm AS term, COUNT(*) AS searches, COUNT(DISTINCT visitor_key) AS visitors, MAX(created_at) AS lastSearched,
              TIMESTAMPDIFF(MINUTE, MAX(created_at), NOW()) AS minutesAgo
         FROM search_logs WHERE created_at >= ${from} AND results_count = 0
        GROUP BY term_norm ORDER BY searches DESC, lastSearched DESC LIMIT 20`, range
    ),
    db.query(
      `SELECT p.id, p.name, p.slug, p.selling_price AS price, p.mrp,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image,
              s.display_name AS sellerName,
              COUNT(*) AS clicks, ROUND(AVG(c.position), 1) AS avgPosition,
              GROUP_CONCAT(DISTINCT c.term_norm ORDER BY c.term_norm SEPARATOR '\\n') AS terms
         FROM search_clicks c
         JOIN search_logs l ON l.id = c.search_log_id
         JOIN products p ON p.id = c.product_id
         JOIN sellers s ON s.id = p.seller_id
        WHERE l.created_at >= ${from}
        GROUP BY p.id, p.name, p.slug, p.selling_price, p.mrp, s.display_name
        ORDER BY clicks DESC LIMIT 20`, range
    ),
    db.query('SELECT CURDATE() AS today'),
  ]);

  // Every day in the window, zero-filled, so the chart's x-axis is continuous.
  const byDay = Object.fromEntries(daily.map((d) => [String(d.day).slice(0, 10), Number(d.searches)]));
  const end = new Date(`${String(today).slice(0, 10)}T00:00:00Z`);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(end.getTime() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { day: d, searches: byDay[d] || 0 };
  });

  const searches = Number(totals.searches) || 0;
  return {
    days,
    summary: {
      searches,
      previousSearches: Number(prev.searches) || 0,
      change: pctChange(searches, Number(prev.searches) || 0),
      uniqueTerms: Number(totals.terms) || 0,
      visitors: Number(totals.visitors) || 0,
      zeroResultSearches: Number(totals.zero) || 0,
      zeroResultRate: searches ? (Number(totals.zero) || 0) / searches : 0,
      productClicks: Number(clickTotals.clicks) || 0,
      clickThroughRate: searches ? (Number(clickTotals.clickedSearches) || 0) / searches : 0,
    },
    daily: series,
    topTerms: topTerms.map((t) => ({
      term: t.term,
      searches: Number(t.searches),
      visitors: Number(t.visitors),
      avgResults: Number(t.avgResults) || 0,
      clicks: Number(t.clicks) || 0,
      clickThroughRate: Number(t.searches) ? (Number(t.clickedSearches) || 0) / Number(t.searches) : 0,
      lastSearched: t.lastSearched,
      minutesAgo: Number(t.minutesAgo) || 0, // computed by the DB, so it is timezone-safe
    })),
    zeroResultTerms: zeroTerms.map((t) => ({
      term: t.term, searches: Number(t.searches), visitors: Number(t.visitors), lastSearched: t.lastSearched, minutesAgo: Number(t.minutesAgo) || 0,
    })),
    topProducts: topProducts.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, image: p.image, sellerName: p.sellerName,
      price: Number(p.price), mrp: Number(p.mrp), clicks: Number(p.clicks), avgPosition: Number(p.avgPosition) || null,
      terms: (p.terms || '').split('\n').filter(Boolean).slice(0, 4),
    })),
  };
}

module.exports = { normalizeTerm, visitorKey, logSearch, logClick, getInsights };
