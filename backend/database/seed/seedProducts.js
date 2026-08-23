require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/config/database');
const slugify = require('../../src/utils/slugify');
const { createInventoryForVariant } = require('../../src/services/inventory.service');
const { randomFrom, PRODUCT_TEMPLATES } = require('./data/demoData');

const SIZE_VALUES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLOR_VALUES = ['Black', 'White', 'Blue', 'Maroon', 'Green', 'Beige'];
const VOLUME_VALUES = ['30ml', '50ml', '100ml'];

const VARIANT_CATEGORY_ATTRS = {
  Fashion: ['Size', 'Color'], "Men's Fashion": ['Size', 'Color'], "Women's Fashion": ['Size', 'Color'],
  'Kids Fashion': ['Size', 'Color'],
  'Perfumes & Fragrances': ['Volume'], "Men's Perfume": ['Volume'], "Women's Perfume": ['Volume'], Attar: ['Volume'],
};

async function ensureAttribute(name, values) {
  let attribute = await db.queryOne('SELECT id FROM attributes WHERE name = :name', { name });
  if (!attribute) {
    const result = await db.query("INSERT INTO attributes (name, input_type) VALUES (:name, 'SELECT')", { name });
    attribute = { id: result.insertId };
  }
  const valueIds = {};
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    let row = await db.queryOne('SELECT id FROM attribute_values WHERE attribute_id = :attrId AND value = :value', {
      attrId: attribute.id,
      value,
    });
    if (!row) {
      const result = await db.query(
        'INSERT INTO attribute_values (attribute_id, value, sort_order) VALUES (:attrId, :value, :sortOrder)',
        { attrId: attribute.id, value, sortOrder: i }
      );
      row = { id: result.insertId };
    }
    valueIds[value] = row.id;
  }
  return { attributeId: attribute.id, valueIds };
}

function randomPrice(base) {
  const mrp = Math.round((base + Math.random() * base * 0.4) / 10) * 10;
  const discountPct = 5 + Math.floor(Math.random() * 35);
  const price = Math.round((mrp * (1 - discountPct / 100)) / 10) * 10;
  return { mrp, price: Math.max(price, 99) };
}

function randomStock() {
  const roll = Math.random();
  if (roll < 0.1) return 0;
  if (roll < 0.35) return 3 + Math.floor(Math.random() * 15);
  return 20 + Math.floor(Math.random() * 180);
}

async function uniqueSlug(name, sellerSuffix) {
  const base = slugify(`${name}-${sellerSuffix}`);
  let slug = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.queryOne('SELECT id FROM products WHERE slug = :slug', { slug });
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function createProduct({ name, categoryId, categoryName, brandId, sellerId, sellerTag, superAdminId, basePrice }) {
  const slug = await uniqueSlug(name, sellerTag);
  // Leave headroom for the longest variant suffix ("-DEFAULT", 8 chars) under the 60-char column limit.
  const sku = `${sellerTag}-${slug}`.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 50);
  const { mrp, price } = randomPrice(basePrice);
  const stock = randomStock();

  const productId = await db.transaction(async (tx) => {
    const result = await tx.query(
      `INSERT INTO products (public_id, seller_id, category_id, brand_id, name, slug, sku, description, short_description,
         mrp, selling_price, tax_rate, hsn_code, return_policy, warranty, status, is_featured, is_bestseller, is_trending,
         approved_by, approved_at)
       VALUES (:publicId, :sellerId, :categoryId, :brandId, :name, :slug, :sku, :description, :shortDescription,
         :mrp, :price, :taxRate, :hsn, '7-day easy returns', '6 months seller warranty', 'ACTIVE',
         :featured, :bestseller, :trending, :approvedBy, NOW())`,
      {
        publicId: uuidv4(), sellerId, categoryId, brandId, name, slug, sku,
        description: `${name} — a premium pick from our ${categoryName} collection, crafted for everyday quality and comfort.`,
        shortDescription: `Premium ${categoryName.toLowerCase()} — ${name}`,
        mrp, price, taxRate: [5, 12, 18][Math.floor(Math.random() * 3)], hsn: '6109',
        featured: Math.random() < 0.1 ? 1 : 0, bestseller: Math.random() < 0.15 ? 1 : 0, trending: Math.random() < 0.12 ? 1 : 0,
        approvedBy: superAdminId,
      }
    );
    const newProductId = result.insertId;

    const attrNames = VARIANT_CATEGORY_ATTRS[categoryName];
    if (attrNames) {
      const combos = attrNames.includes('Volume')
        ? VOLUME_VALUES.map((v) => ({ Volume: v }))
        : SIZE_VALUES.slice(0, 3 + Math.floor(Math.random() * 3)).flatMap((size) =>
            [randomFrom(COLOR_VALUES)].map((color) => ({ Size: size, Color: color }))
          );

      for (let i = 0; i < combos.length; i += 1) {
        const combo = combos[i];
        const variantPrice = price + (i === 0 ? 0 : Math.round(Math.random() * 100));
        const variantResult = await tx.query(
          `INSERT INTO product_variants (product_id, sku, price, mrp) VALUES (:productId, :sku, :price, :mrp)`,
          { productId: newProductId, sku: `${sku}-V${i + 1}`, price: variantPrice, mrp: mrp + (variantPrice - price) }
        );
        for (const [attrName, value] of Object.entries(combo)) {
          const attrData = await tx.queryOne('SELECT id FROM attributes WHERE name = :name', { name: attrName });
          const valueRow = await tx.queryOne('SELECT id FROM attribute_values WHERE attribute_id = :attrId AND value = :value', {
            attrId: attrData.id,
            value,
          });
          await tx.query(
            `INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id) VALUES (:variantId, :attrId, :valueId)`,
            { variantId: variantResult.insertId, attrId: attrData.id, valueId: valueRow.id }
          );
        }
        await createInventoryForVariant(variantResult.insertId, sellerId, randomStock(), tx);
      }
    } else {
      const variantResult = await tx.query(
        `INSERT INTO product_variants (product_id, sku, price, mrp) VALUES (:productId, :sku, :price, :mrp)`,
        { productId: newProductId, sku: `${sku}-DEFAULT`, price, mrp }
      );
      await createInventoryForVariant(variantResult.insertId, sellerId, stock, tx);
    }

    const imageCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < imageCount; i += 1) {
      await tx.query(
        `INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES (:productId, :url, :sortOrder, :isPrimary)`,
        { productId: newProductId, url: `https://picsum.photos/seed/${slug}-${i}/600/600`, sortOrder: i, isPrimary: i === 0 ? 1 : 0 }
      );
    }

    return newProductId;
  });

  return productId;
}

async function run(targetCount = 150) {
  const sellers = await db.query('SELECT id, display_name FROM sellers WHERE status = "APPROVED"');
  const categories = await db.query('SELECT id, name FROM categories');
  const brands = await db.query('SELECT id FROM brands');
  const superAdmin = await db.queryOne("SELECT id FROM users WHERE user_type = 'ADMIN' LIMIT 1");

  if (!sellers.length) {
    console.log('No approved sellers found — run seed:sellers first');
    return;
  }

  await ensureAttribute('Size', SIZE_VALUES);
  await ensureAttribute('Color', COLOR_VALUES);
  await ensureAttribute('Volume', VOLUME_VALUES);

  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]));
  const leafCategories = Object.keys(PRODUCT_TEMPLATES).filter((name) => categoryByName[name]);

  const existingCount = await db.queryOne('SELECT COUNT(*) AS count FROM products');
  let created = 0;
  const perSeller = Math.ceil(targetCount / sellers.length);

  for (const seller of sellers) {
    const sellerTag = seller.display_name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'SLR';
    for (let i = 0; i < perSeller && created < targetCount; i += 1) {
      const categoryName = randomFrom(leafCategories);
      const category = categoryByName[categoryName];
      const productName = randomFrom(PRODUCT_TEMPLATES[categoryName]);
      const brandId = Math.random() < 0.8 ? randomFrom(brands).id : null;
      const basePrice = categoryName.includes('Perfume') || categoryName === 'Attar' ? 800
        : categoryName === 'Fabrics' || ['Cotton', 'Silk', 'Linen'].includes(categoryName) ? 600
          : categoryName === 'Footwear' ? 1500
            : categoryName === 'Accessories' ? 700
              : categoryName === 'Beauty & Personal Care' ? 350
                : 1200;

      // eslint-disable-next-line no-await-in-loop
      await createProduct({
        name: productName, categoryId: category.id, categoryName, brandId, sellerId: seller.id,
        sellerTag: `${sellerTag}${seller.id}`, superAdminId: superAdmin?.id, basePrice,
      });
      created += 1;
      if (created % 10 === 0) console.log(`${created} products created…`);
    }
  }

  console.log(`\nDone. ${created} new products created (${existingCount.count} existed before this run).`);
}

if (require.main === module) {
  const target = parseInt(process.argv[2], 10) || 150;
  run(target)
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
