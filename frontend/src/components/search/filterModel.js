// URL <-> filter state for the search page. Multi-select values travel as comma lists
// (?category=1,4&brand=9) so a filtered page can be bookmarked or shared.

export const EMPTY_FILTERS = { category: [], brand: [], minPrice: '', maxPrice: '', minDiscount: '', minRating: '', inStock: false };

export const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'discount', label: 'Biggest Discount' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export const PRICE_RANGES = [
  { min: '', max: 499, label: 'Under ₹499' },
  { min: 500, max: 999, label: '₹500 – ₹999' },
  { min: 1000, max: 1999, label: '₹1,000 – ₹1,999' },
  { min: 2000, max: '', label: '₹2,000 & above' },
];
export const DISCOUNTS = [10, 20, 30, 40];
export const RATINGS = [4, 3];

export const SECTIONS = [
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'discount', label: 'Discount' },
  { key: 'brand', label: 'Brand' },
  { key: 'rating', label: 'Customer Rating' },
  { key: 'availability', label: 'Availability' },
];

const ids = (v) => (v ? String(v).split(',').map(Number).filter((n) => n > 0) : []);

export function fromParams(sp) {
  return {
    category: ids(sp.get('category')),
    brand: ids(sp.get('brand')),
    minPrice: sp.get('minPrice') || '',
    maxPrice: sp.get('maxPrice') || '',
    minDiscount: sp.get('minDiscount') || '',
    minRating: sp.get('minRating') || '',
    inStock: sp.get('inStock') === '1',
  };
}

/** Writes filters into a copy of `sp`, keeping q/sort; drops empty values. */
export function toParams(filters, sp) {
  const next = new URLSearchParams(sp);
  const set = (k, v) => (v === '' || v == null || v === false || (Array.isArray(v) && !v.length) ? next.delete(k) : next.set(k, v));
  set('category', filters.category.join(','));
  set('brand', filters.brand.join(','));
  set('minPrice', filters.minPrice);
  set('maxPrice', filters.maxPrice);
  set('minDiscount', filters.minDiscount);
  set('minRating', filters.minRating);
  set('inStock', filters.inStock ? '1' : '');
  next.delete('page');
  return next;
}

/** API query for listProducts. */
export function toQuery(filters, q, sort) {
  const out = {};
  if (q) out.q = q;
  if (sort) out.sort = sort;
  if (filters.category.length) out.category = filters.category.join(',');
  if (filters.brand.length) out.brand = filters.brand.join(',');
  ['minPrice', 'maxPrice', 'minDiscount', 'minRating'].forEach((k) => { if (filters[k] !== '') out[k] = filters[k]; });
  if (filters.inStock) out.inStock = 1;
  return out;
}

export function sectionActive(key, f) {
  switch (key) {
    case 'category': return f.category.length > 0;
    case 'brand': return f.brand.length > 0;
    case 'price': return f.minPrice !== '' || f.maxPrice !== '';
    case 'discount': return f.minDiscount !== '';
    case 'rating': return f.minRating !== '';
    case 'availability': return f.inStock;
    default: return false;
  }
}

export const clearSection = (key) => ({
  category: { category: [] },
  brand: { brand: [] },
  price: { minPrice: '', maxPrice: '' },
  discount: { minDiscount: '' },
  rating: { minRating: '' },
  availability: { inStock: false },
}[key]);

export const activeCount = (f) => f.category.length + f.brand.length + ['price', 'discount', 'rating', 'availability'].filter((k) => sectionActive(k, f)).length;

const inr = (v) => `₹${Number(v).toLocaleString('en-IN')}`;
export function priceLabel(f) {
  if (f.minPrice !== '' && f.maxPrice !== '') return `${inr(f.minPrice)} – ${inr(f.maxPrice)}`;
  if (f.maxPrice !== '') return `Under ${inr(f.maxPrice)}`;
  return `${inr(f.minPrice)} & above`;
}

/** Applied-filter chips: [{ key, label, patch }] where `patch` removes that one value. */
export function appliedChips(f, { categories = [], brands = [] }) {
  const name = (list, id) => list.find((x) => x.id === id)?.name || `#${id}`;
  const chips = [];
  f.category.forEach((id) => chips.push({ key: `c${id}`, label: name(categories, id), patch: { category: f.category.filter((x) => x !== id) } }));
  f.brand.forEach((id) => chips.push({ key: `b${id}`, label: name(brands, id), patch: { brand: f.brand.filter((x) => x !== id) } }));
  if (sectionActive('price', f)) chips.push({ key: 'price', label: priceLabel(f), patch: clearSection('price') });
  if (f.minDiscount !== '') chips.push({ key: 'disc', label: `${f.minDiscount}% off & more`, patch: clearSection('discount') });
  if (f.minRating !== '') chips.push({ key: 'rate', label: `${f.minRating}★ & above`, patch: clearSection('rating') });
  if (f.inStock) chips.push({ key: 'stock', label: 'In stock', patch: clearSection('availability') });
  return chips;
}
