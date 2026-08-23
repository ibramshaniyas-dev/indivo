require('dotenv').config();
const db = require('../../src/config/database');

const BANNERS = [
  { title: "India's Best Collections", subtitle: 'Discover Something Special', cta: 'Shop Now', link: '/search' },
  { title: 'Premium Fashion, One Destination', subtitle: 'Curated styles from India\'s finest sellers', cta: 'Explore Collections', link: '/search?category=1' },
  { title: 'Discover Beautiful Fabrics', subtitle: 'Cotton, silk, linen and more', cta: 'Shop Fabrics', link: '/search' },
  { title: 'Fragrances That Define You', subtitle: 'Royal ouds to fresh colognes', cta: 'Shop Perfumes', link: '/search' },
  { title: 'Traditional Craft, Modern Style', subtitle: 'Handloom heritage, reimagined', cta: 'Shop Handloom', link: '/search' },
  { title: 'Shop Premium Collections', subtitle: 'Fashion, fabrics, fragrances and lifestyle', cta: 'Start Shopping', link: '/search' },
];

const HOMEPAGE_SECTIONS = [
  { type: 'HERO', config: { title: 'Discover Collections' } },
  { type: 'CATEGORY_GRID', config: { title: 'Shop by Category' } },
  { type: 'TRENDING_PRODUCTS', config: { title: 'Trending Products' } },
  { type: 'PREMIUM_FASHION', config: { title: 'Premium Fashion' } },
  { type: 'FABRIC_COLLECTION', config: { title: 'Fabric Collection' } },
  { type: 'FRAGRANCE_COLLECTION', config: { title: 'Fragrance Collection' } },
  { type: 'BEST_SELLERS', config: { title: 'Best Sellers' } },
  { type: 'FEATURED_SELLERS', config: { title: 'Featured Sellers' } },
  { type: 'NEW_ARRIVALS', config: { title: 'New Arrivals' } },
  { type: 'SPECIAL_OFFERS', config: { title: 'Special Offers' } },
  { type: 'CUSTOMER_REVIEWS', config: { title: 'Customer Reviews' } },
  { type: 'NEWSLETTER', config: { title: 'Stay in the loop' } },
];

async function run() {
  const existingBanners = await db.queryOne('SELECT COUNT(*) AS count FROM banners');
  if (Number(existingBanners.count) === 0) {
    for (let i = 0; i < BANNERS.length; i += 1) {
      const b = BANNERS[i];
      await db.query(
        `INSERT INTO banners (title, image, link, position, sort_order, status)
         VALUES (:title, :image, :link, 'HOME_HERO', :sortOrder, 'ACTIVE')`,
        { title: `${b.title} — ${b.subtitle}`, image: `https://picsum.photos/seed/banner-${i}/1600/600`, link: b.link, sortOrder: i }
      );
    }
    console.log(`${BANNERS.length} banners created`);
  } else {
    console.log('Banners already exist — skipping');
  }

  const existingSections = await db.queryOne("SELECT COUNT(*) AS count FROM cms_sections WHERE page_key = 'HOME'");
  if (Number(existingSections.count) === 0) {
    for (let i = 0; i < HOMEPAGE_SECTIONS.length; i += 1) {
      const s = HOMEPAGE_SECTIONS[i];
      await db.query(
        `INSERT INTO cms_sections (page_key, section_type, config, sort_order, status)
         VALUES ('HOME', :type, :config, :sortOrder, 'ACTIVE')`,
        { type: s.type, config: JSON.stringify(s.config), sortOrder: i }
      );
    }
    console.log(`${HOMEPAGE_SECTIONS.length} homepage CMS sections created`);
  } else {
    console.log('Homepage CMS sections already exist — skipping');
  }

  const existingPage = await db.queryOne("SELECT id FROM cms_pages WHERE slug = 'about'");
  if (!existingPage) {
    await db.query(
      `INSERT INTO cms_pages (slug, title, content, status) VALUES
       ('about', 'About INDIVO', 'INDIVO is India''s marketplace for fashion, fabrics, fragrances and lifestyle — connecting customers directly with trusted independent sellers across the country.', 'PUBLISHED')`
    );
    console.log('About page created');
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
