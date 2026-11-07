import { useEffect, useState } from 'react';
import { getPublicSettings } from '../services/settings.service';
import { BRAND } from '../brand';

// Store profile managed by the Super Admin (Settings → General). Fetched once per page load and
// shared by every component; BRAND values are only used until the response arrives / on error.
const FALLBACK = {
  general: {
    site_name: BRAND.name, tagline: BRAND.tagline, support_email: '', support_phone: '',
    whatsapp_number: '', business_address: '', gstin: '',
  },
  order: { cod_enabled: true },
};

let cached = null;
let inflight = null;
const subscribers = new Set();

function fetchOnce() {
  if (!inflight) {
    inflight = getPublicSettings()
      .then((data) => {
        cached = {
          general: { ...FALLBACK.general, ...(data.general || {}) },
          order: { ...FALLBACK.order, ...(data.order || {}) },
        };
        subscribers.forEach((fn) => fn(cached));
      })
      .catch(() => { inflight = null; });
  }
  return inflight;
}

/** Call after saving settings in the dashboard so the storefront picks up the change. */
export function refreshStoreSettings() {
  inflight = null;
  return fetchOnce();
}

export default function useStoreSettings() {
  const [value, setValue] = useState(cached || FALLBACK);
  useEffect(() => {
    subscribers.add(setValue);
    if (cached) setValue(cached); else fetchOnce();
    return () => subscribers.delete(setValue);
  }, []);
  return value;
}
