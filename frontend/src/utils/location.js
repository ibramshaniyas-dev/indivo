// Shared delivery-location state (header "Deliver to …", checkout pre-selection).
// Stored per device; every change is broadcast so all components stay in sync.

const STORAGE_KEY = 'seeshaa.location';
export const LOCATION_EVENT = 'seeshaa:location';

export function getSavedLocation() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}

export function saveLocation(loc) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch { /* private mode etc. */ }
  window.dispatchEvent(new CustomEvent(LOCATION_EVENT, { detail: loc }));
}

const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * How close a saved address is to the detected location. Addresses have no coordinates, so this
 * matches administrative fields: same pincode (strongest) > same area/locality > same city or
 * district > same state.
 */
export function matchScore(address, gps) {
  if (!address || !gps) return 0;
  let score = 0;
  if (gps.pincode && String(address.pincode) === String(gps.pincode)) score += 100;
  const addrText = norm(`${address.address_line1} ${address.address_line2} ${address.city} ${address.district}`);
  if (gps.locality && norm(gps.locality).length > 2 && addrText.includes(norm(gps.locality))) score += 40;
  const cities = [gps.city, gps.district].filter(Boolean).map(norm);
  if (cities.some((c) => c && (c === norm(address.city) || c === norm(address.district)))) score += 30;
  // Pincodes sharing the first 3 digits are in the same postal district.
  if (gps.pincode && address.pincode && String(address.pincode).slice(0, 3) === String(gps.pincode).slice(0, 3)) score += 15;
  if (gps.state && norm(gps.state) === norm(address.state)) score += 5;
  return score;
}

/** Nearest saved address to the detected location, or null if none is meaningfully close (same city or better). */
export function pickNearestAddress(addresses, gps) {
  if (!addresses?.length || !gps) return null;
  let best = null;
  let bestScore = 0;
  for (const a of addresses) {
    const s = matchScore(a, gps) + (a.is_default ? 1 : 0); // default wins ties
    if (s > bestScore) { best = a; bestScore = s; }
  }
  return bestScore >= 30 ? best : null;
}

/** Location object for a saved address (what the header shows). */
export function locationFromAddress(a) {
  return {
    source: 'address',
    addressId: a.id,
    name: a.name,
    label: a.type ? a.type.charAt(0) + a.type.slice(1).toLowerCase() : 'Address',
    line: [a.address_line1, a.address_line2].filter(Boolean).join(', '),
    city: a.city,
    state: a.state,
    pincode: a.pincode,
  };
}

/** Coordinates -> address via BigDataCloud's free client-side reverse geocoder (no key needed). */
export async function reverseGeocode(lat, lon) {
  const res = await fetch(`https://api-bdc.io/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
  if (!res.ok) throw new Error('lookup failed');
  const d = await res.json();
  const admin = d.localityInfo?.administrative || [];
  const district = admin.find((x) => x.adminLevel === 5)?.name || '';
  const locality = d.locality && d.locality !== d.city ? d.locality : '';
  return {
    source: 'gps',
    locality,
    city: d.city || d.locality || district || d.principalSubdivision || '',
    district,
    state: d.principalSubdivision || '',
    pincode: d.postcode || '',
    lat, lon,
    detectedAt: Date.now(),
  };
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 });
  });
}

/** Short header text, e.g. "Coimbatore 641012" or "Gandhipuram, Coimbatore". */
export function shortPlace(loc) {
  if (!loc) return '';
  if (loc.source === 'address') return [loc.city, loc.pincode].filter(Boolean).join(' ');
  return [loc.locality, loc.city].filter(Boolean).join(', ') + (loc.pincode ? ` ${loc.pincode}` : '');
}
