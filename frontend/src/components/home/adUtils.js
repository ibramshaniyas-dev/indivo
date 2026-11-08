import { realImage, responsiveImage } from '../../utils/images';

export const pct = (p) => (p.mrp && Number(p.mrp) > Number(p.price) ? Math.round((1 - p.price / p.mrp) * 100) : 0);
export const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/** Products that have a real photo, de-duplicated by photo, with responsive src/srcSet attached. */
export function withPhotos(products = [], n = 4) {
  const seen = new Set();
  const out = [];
  for (const p of products) {
    const url = realImage(p.image);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const r = responsiveImage(url);
    out.push({ ...p, src: r.src, srcSet: r.srcSet });
    if (out.length >= n) break;
  }
  return out;
}

/** Real offer stats for a list: biggest discount and lowest price. */
export function offerStats(products = []) {
  if (!products.length) return { maxDiscount: 0, from: 0 };
  return {
    maxDiscount: Math.max(...products.map(pct)),
    from: Math.min(...products.map((p) => Number(p.price) || Infinity)),
  };
}

// Rich ad palettes (no black — black is reserved for the logo).
export const AD_THEMES = [
  { bg: 'linear-gradient(120deg, #7A0F1C 0%, #B3202E 55%, #E0533D 100%)', accent: '#FFD54F', ink: '#fff' },
  { bg: 'linear-gradient(120deg, #0B4F4A 0%, #11766C 55%, #2FA58F 100%)', accent: '#FFE08A', ink: '#fff' },
  { bg: 'linear-gradient(120deg, #2B1E6B 0%, #4B35A8 55%, #7B5CE0 100%)', accent: '#FFD166', ink: '#fff' },
  { bg: 'linear-gradient(120deg, #7A5517 0%, #A87A22 50%, #E2B04A 100%)', accent: '#FFF3C4', ink: '#fff' },
  { bg: 'linear-gradient(120deg, #8A1457 0%, #C2185B 55%, #F06292 100%)', accent: '#FFE082', ink: '#fff' },
  { bg: 'linear-gradient(120deg, #0D3B66 0%, #155E9C 55%, #3A8DD8 100%)', accent: '#FFD54F', ink: '#fff' },
];
