import { useEffect, useState } from 'react';
import { getSavedLocation, LOCATION_EVENT } from '../utils/location';
import { getDemoAvailability } from '../services/homeDemo.service';

// Home-demo availability for the shopper's current GPS location. One request per location
// (rounded to ~100 m) is shared by every component on the page.
const EMPTY = { zone: null, products: [], productIds: new Set() };
const cache = new Map();

function gpsOf(loc) {
  const g = loc?.gps || (loc?.source === 'gps' ? loc : null);
  return g && Number.isFinite(g.lat) && Number.isFinite(g.lon) ? g : null;
}

function fetchFor(g) {
  const key = `${g.lat.toFixed(3)},${g.lon.toFixed(3)}`;
  if (!cache.has(key)) {
    cache.set(key, getDemoAvailability(g.lat, g.lon)
      .then((d) => ({ ...d, productIds: new Set(d.products.map((p) => p.id)) }))
      .catch(() => { cache.delete(key); return EMPTY; }));
  }
  return cache.get(key);
}

export default function useHomeDemo() {
  const [gps, setGps] = useState(() => gpsOf(getSavedLocation()));
  const [state, setState] = useState({ ...EMPTY, loading: Boolean(gps) });

  useEffect(() => {
    const onChange = (e) => setGps(gpsOf(e.detail));
    window.addEventListener(LOCATION_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!gps) { setState({ ...EMPTY, loading: false }); return undefined; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetchFor(gps).then((d) => { if (alive) setState({ ...d, loading: false }); });
    return () => { alive = false; };
  }, [gps?.lat, gps?.lon]);

  return { ...state, gps, hasLocation: Boolean(gps) };
}
