// One-off maintenance script: replaces the random/unrelated picsum.photos placeholder images on
// already-seeded products with keyword-matched photos (a shirt product gets a shirt photo, a
// perfume gets a perfume-bottle photo, etc.) — updates product_images and categories.image in
// place, does not touch products/orders, so it's safe to run against a database with real orders.
require('dotenv').config();
const db = require('../../src/config/database');
const { getImageKeyword, CATEGORY_IMAGE_KEYWORDS } = require('./data/demoData');

function imageUrl(keyword, lockSeed) {
  return `https://loremflickr.com/600/600/${keyword}?lock=${lockSeed}`;
}

async function fixProducts() {
  const products = await db.query('SELECT p.id, p.name, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id');
  let updated = 0;

  for (const product of products) {
    const images = await db.query('SELECT id, sort_order FROM product_images WHERE product_id = :id ORDER BY sort_order ASC', {
      id: product.id,
    });
    if (images.length === 0) continue;

    const keyword = getImageKeyword(product.name, product.category_name);
    for (const img of images) {
      await db.query('UPDATE product_images SET url = :url WHERE id = :id', {
        id: img.id,
        url: imageUrl(keyword, `${product.id}${img.sort_order}`),
      });
    }
    updated += 1;
    if (updated % 25 === 0) console.log(`${updated} products updated…`);
  }

  console.log(`Done — updated images for ${updated} products`);
}

async function fixCategories() {
  const categories = await db.query('SELECT id, name FROM categories');
  let updated = 0;
  for (const category of categories) {
    const keyword = CATEGORY_IMAGE_KEYWORDS[category.name] || 'shopping';
    await db.query('UPDATE categories SET image = :image WHERE id = :id', {
      id: category.id,
      image: imageUrl(keyword, `cat${category.id}`),
    });
    updated += 1;
  }
  console.log(`Done — updated images for ${updated} categories`);
}

async function run() {
  await fixProducts();
  await fixCategories();
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
