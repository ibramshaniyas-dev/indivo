require('dotenv').config();
const db = require('../../src/config/database');
const slugify = require('../../src/utils/slugify');
const { CATEGORY_TREE, BRANDS } = require('./data/demoData');

async function upsertCategory(name, parentId) {
  const slug = slugify(name);
  const existing = await db.queryOne('SELECT id FROM categories WHERE slug = :slug', { slug });
  if (existing) return existing.id;
  const result = await db.query(
    'INSERT INTO categories (parent_id, name, slug) VALUES (:parentId, :name, :slug)',
    { parentId: parentId || null, name, slug }
  );
  return result.insertId;
}

async function upsertBrand(name) {
  const slug = slugify(name);
  const existing = await db.queryOne('SELECT id FROM brands WHERE slug = :slug', { slug });
  if (existing) return existing.id;
  const result = await db.query('INSERT INTO brands (name, slug) VALUES (:name, :slug)', { name, slug });
  return result.insertId;
}

async function run() {
  const categoryIds = {};
  for (const top of CATEGORY_TREE) {
    const topId = await upsertCategory(top.name);
    categoryIds[top.name] = topId;
    for (const child of top.children) {
      categoryIds[child] = await upsertCategory(child, topId);
    }
  }
  console.log(`Categories ready: ${Object.keys(categoryIds).length}`);

  const brandIds = [];
  for (const name of BRANDS) {
    brandIds.push(await upsertBrand(name));
  }
  console.log(`Brands ready: ${brandIds.length}`);

  return { categoryIds, brandIds };
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
