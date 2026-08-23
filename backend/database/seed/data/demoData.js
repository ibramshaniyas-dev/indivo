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

module.exports = { FIRST_NAMES, LAST_NAMES, randomFrom, randomName, SELLERS, CITIES, BRANDS, CATEGORY_TREE, PRODUCT_TEMPLATES };
