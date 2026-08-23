// Shared pools of realistic (synthetic) Indian names and product templates used by the
// demo seed scripts. No real personal data — every name here is a common-name placeholder.

const FIRST_NAMES = [
  'Arun', 'Priya', 'Karthik', 'Divya', 'Sanjay', 'Meena', 'Rahul', 'Anjali', 'Vijay', 'Nandhini',
  'Arjun', 'Vignesh', 'Deepa', 'Suresh', 'Lakshmi', 'Kiran', 'Pooja', 'Manoj', 'Swathi', 'Ganesh',
  'Ramya', 'Ashok', 'Kavya', 'Naveen', 'Sneha', 'Prakash', 'Aishwarya', 'Vikram', 'Harini', 'Dinesh',
  'Bhavana', 'Senthil', 'Revathi', 'Mahesh', 'Shalini', 'Ravi', 'Gayathri', 'Anand', 'Preethi', 'Kumar',
];
const LAST_NAMES = [
  'Kumar', 'Raj', 'S', 'R', 'Krishnan', 'M', 'Devi', 'Anand', 'Nair', 'Iyer',
  'Menon', 'Reddy', 'Sharma', 'Rao', 'Pillai', 'Gupta', 'Varma', 'Chandran', 'Subramaniam', 'Narayan',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  return `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
}

const SELLERS = [
  { company: 'Heritage Weaves India', display: 'Heritage Weaves', category: 'Handloom & Fabrics' },
  { company: 'Royal Threads Fashion Pvt Ltd', display: 'Royal Threads Fashion', category: "Men's & Women's Fashion" },
  { company: 'Aroma Royale Fragrances', display: 'Aroma Royale', category: 'Perfumes & Fragrances' },
  { company: 'Urban Style Studio', display: 'Urban Style Studio', category: 'Fashion' },
  { company: 'Silk Route Collections', display: 'Silk Route Collections', category: 'Silk & Traditional Wear' },
  { company: 'Classic Cotton House', display: 'Classic Cotton House', category: 'Cotton Fabrics' },
  { company: 'Luxe Fragrance Co', display: 'Luxe Fragrance Co.', category: 'Perfumes' },
  { company: 'Trendy Wardrobe India', display: 'Trendy Wardrobe India', category: 'Fashion' },
  { company: 'Bharat Handloom House', display: 'Bharat Handloom House', category: 'Handloom' },
  { company: 'Elegant Lifestyle Store', display: 'Elegant Lifestyle Store', category: 'Fashion & Lifestyle' },
];

const CITIES = [
  { city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  { city: 'Madurai', state: 'Tamil Nadu', pincode: '625001' },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Erode', state: 'Tamil Nadu', pincode: '638001' },
  { city: 'Salem', state: 'Tamil Nadu', pincode: '636001' },
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Surat', state: 'Gujarat', pincode: '395001' },
  { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
];

const BRANDS = [
  'Indivo Essentials', 'Zaraline', 'CottonCraft', 'FragranceHouse', 'StyleNest', 'TrendWeave',
  'PureSilk', 'UrbanThreads', 'AromaCo', 'HandloomIndia', 'ClassicWear', 'GoldenScent',
  'WeaveStory', 'ChicDrobe', 'NatureGlow',
];

const CATEGORY_TREE = [
  { name: 'Fashion', children: ["Men's Fashion", "Women's Fashion", 'Kids Fashion'] },
  { name: 'Fabrics', children: ['Cotton', 'Silk', 'Linen'] },
  { name: 'Perfumes & Fragrances', children: ["Men's Perfume", "Women's Perfume", 'Attar'] },
  { name: 'Beauty & Personal Care', children: [] },
  { name: 'Accessories', children: [] },
  { name: 'Footwear', children: [] },
];

const PRODUCT_TEMPLATES = {
  Fashion: [
    "Men's Premium Cotton Casual Shirt", 'Classic Linen Formal Shirt', "Men's Slim Fit Denim Jeans",
    'Premium Cotton Kurta', "Women's Floral Printed Dress", "Women's Designer Anarkali",
    'Premium Silk Saree', 'Hand Embroidered Churidar', 'Kids Cotton Party Wear Set',
    "Men's Casual Polo T-Shirt", "Women's Straight Fit Trousers", "Men's Formal Blazer",
    "Women's Embroidered Lehenga", 'Kids Denim Dungaree', "Men's Ethnic Nehru Jacket",
  ],
  "Men's Fashion": [
    "Men's Premium Cotton Casual Shirt", 'Classic Linen Formal Shirt', "Men's Slim Fit Denim Jeans",
    'Premium Cotton Kurta', "Men's Casual Polo T-Shirt", "Men's Formal Blazer", "Men's Ethnic Nehru Jacket",
  ],
  "Women's Fashion": [
    "Women's Floral Printed Dress", "Women's Designer Anarkali", 'Premium Silk Saree',
    'Hand Embroidered Churidar', "Women's Straight Fit Trousers", "Women's Embroidered Lehenga",
  ],
  'Kids Fashion': ['Kids Cotton Party Wear Set', 'Kids Denim Dungaree', 'Kids Ethnic Wear Set'],
  Fabrics: [
    'Premium Egyptian Cotton Fabric', 'Pure Kanchipuram Silk Fabric', 'Premium Linen Suit Fabric',
    'Designer Rayon Fabric', 'Premium Denim Fabric', 'Soft Velvet Fabric', 'Organic Cotton Fabric',
    'Printed Cotton Fabric', 'Premium Wool Blend Fabric', 'Chanderi Silk Fabric',
  ],
  Cotton: ['Premium Egyptian Cotton Fabric', 'Organic Cotton Fabric', 'Printed Cotton Fabric'],
  Silk: ['Pure Kanchipuram Silk Fabric', 'Chanderi Silk Fabric', 'Banarasi Silk Fabric'],
  Linen: ['Premium Linen Suit Fabric', 'Pure Linen Shirting Fabric'],
  'Perfumes & Fragrances': [
    'Royal Oud Eau De Parfum', 'Imperial Musk Perfume', 'Golden Amber Eau De Parfum',
    'Classic Rose Fragrance', 'Sandalwood Premium Attar', 'Ocean Breeze Eau De Toilette',
    'Royal Leather Fragrance', 'White Musk Unisex Perfume', 'Heritage Oud Attar', 'Citrus Fresh Cologne',
  ],
  "Men's Perfume": ['Royal Oud Eau De Parfum', 'Royal Leather Fragrance', 'Citrus Fresh Cologne'],
  "Women's Perfume": ['Golden Amber Eau De Parfum', 'Classic Rose Fragrance', 'Ocean Breeze Eau De Toilette'],
  Attar: ['Sandalwood Premium Attar', 'Heritage Oud Attar'],
  'Beauty & Personal Care': [
    'Herbal Face Wash', 'Premium Hair Serum', 'Natural Body Lotion', 'Luxury Face Cream',
    'Organic Hair Oil', 'Charcoal Face Mask', 'Vitamin C Face Serum', 'Aloe Vera Gel',
  ],
  Accessories: [
    'Leather Wallet', 'Premium Belt', 'Classic Sunglasses', 'Silk Tie', 'Designer Handbag',
    'Travel Backpack', 'Leather Watch Strap', 'Cufflink Set',
  ],
  Footwear: [
    'Classic Leather Loafers', 'Premium Casual Sneakers', "Women's Designer Flats",
    'Traditional Jutti', "Men's Formal Shoes", "Women's Block Heels", 'Kids Sports Shoes',
  ],
};

// Maps each product template name to a real search keyword so seeded photos actually depict
// the product (a shirt looks like a shirt, a perfume bottle looks like a perfume bottle) instead
// of a random unrelated stock photo. Falls back to a category-level keyword for anything unmapped.
const PRODUCT_IMAGE_KEYWORDS = {
  "Men's Premium Cotton Casual Shirt": 'mens-shirt',
  'Classic Linen Formal Shirt': 'formal-shirt',
  "Men's Slim Fit Denim Jeans": 'denim-jeans',
  'Premium Cotton Kurta': 'kurta',
  "Women's Floral Printed Dress": 'summer-dress',
  "Women's Designer Anarkali": 'anarkali-dress',
  'Premium Silk Saree': 'silk-saree',
  'Hand Embroidered Churidar': 'churidar',
  'Kids Cotton Party Wear Set': 'kids-clothing',
  "Men's Casual Polo T-Shirt": 'polo-shirt',
  "Women's Straight Fit Trousers": 'womens-trousers',
  "Men's Formal Blazer": 'blazer',
  "Women's Embroidered Lehenga": 'lehenga',
  'Kids Denim Dungaree': 'kids-fashion',
  "Men's Ethnic Nehru Jacket": 'nehru-jacket',
  'Kids Ethnic Wear Set': 'kids-ethnic-wear',
  'Premium Egyptian Cotton Fabric': 'cotton-fabric',
  'Pure Kanchipuram Silk Fabric': 'silk-fabric',
  'Premium Linen Suit Fabric': 'linen-fabric',
  'Designer Rayon Fabric': 'fabric-texture',
  'Premium Denim Fabric': 'denim-fabric',
  'Soft Velvet Fabric': 'velvet-fabric',
  'Organic Cotton Fabric': 'cotton-fabric',
  'Printed Cotton Fabric': 'printed-fabric',
  'Premium Wool Blend Fabric': 'wool-fabric',
  'Chanderi Silk Fabric': 'silk-fabric',
  'Banarasi Silk Fabric': 'silk-saree',
  'Pure Linen Shirting Fabric': 'linen-fabric',
  'Royal Oud Eau De Parfum': 'perfume-bottle',
  'Imperial Musk Perfume': 'perfume-bottle',
  'Golden Amber Eau De Parfum': 'perfume',
  'Classic Rose Fragrance': 'perfume',
  'Sandalwood Premium Attar': 'attar-bottle',
  'Ocean Breeze Eau De Toilette': 'cologne',
  'Royal Leather Fragrance': 'perfume-bottle',
  'White Musk Unisex Perfume': 'perfume',
  'Heritage Oud Attar': 'attar-bottle',
  'Citrus Fresh Cologne': 'cologne',
  'Herbal Face Wash': 'skincare',
  'Premium Hair Serum': 'hair-care',
  'Natural Body Lotion': 'body-lotion',
  'Luxury Face Cream': 'face-cream',
  'Organic Hair Oil': 'hair-oil',
  'Charcoal Face Mask': 'face-mask',
  'Vitamin C Face Serum': 'serum-bottle',
  'Aloe Vera Gel': 'aloe-vera',
  'Leather Wallet': 'leather-wallet',
  'Premium Belt': 'leather-belt',
  'Classic Sunglasses': 'sunglasses',
  'Silk Tie': 'necktie',
  'Designer Handbag': 'handbag',
  'Travel Backpack': 'backpack',
  'Leather Watch Strap': 'wristwatch',
  'Cufflink Set': 'cufflinks',
  'Classic Leather Loafers': 'leather-loafers',
  'Premium Casual Sneakers': 'sneakers',
  "Women's Designer Flats": 'womens-flats',
  'Traditional Jutti': 'indian-juttis',
  "Men's Formal Shoes": 'formal-shoes',
  "Women's Block Heels": 'block-heels',
  'Kids Sports Shoes': 'kids-shoes',
};

const CATEGORY_IMAGE_KEYWORDS = {
  Fashion: 'fashion-clothing', "Men's Fashion": 'mens-fashion', "Women's Fashion": 'womens-fashion',
  'Kids Fashion': 'kids-fashion', Fabrics: 'fabric-texture', Cotton: 'cotton-fabric', Silk: 'silk-fabric',
  Linen: 'linen-fabric', 'Perfumes & Fragrances': 'perfume-bottle', "Men's Perfume": 'cologne',
  "Women's Perfume": 'perfume', Attar: 'attar-bottle', 'Beauty & Personal Care': 'cosmetics',
  Accessories: 'fashion-accessories', Footwear: 'shoes',
};

function getImageKeyword(productName, categoryName) {
  return PRODUCT_IMAGE_KEYWORDS[productName] || CATEGORY_IMAGE_KEYWORDS[categoryName] || 'product';
}

module.exports = {
  FIRST_NAMES, LAST_NAMES, randomFrom, randomName, SELLERS, CITIES, BRANDS, CATEGORY_TREE, PRODUCT_TEMPLATES,
  CATEGORY_IMAGE_KEYWORDS, getImageKeyword,
};
