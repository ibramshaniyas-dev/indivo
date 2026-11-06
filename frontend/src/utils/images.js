// Hosts used only by the old demo seed scripts for random stock pictures. They are not photos of
// the actual product, so the storefront treats them as "no image" and shows the branded
// placeholder instead. Real seller uploads (served from our own /uploads) always pass through.
const DEMO_IMAGE_HOSTS = ['loremflickr.com', 'picsum.photos', 'placehold.co', 'via.placeholder.com', 'dummyimage.com'];
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

// Origin that serves /uploads — the backend behind VITE_API_URL (e.g. https://site.com/api/v1 → https://site.com).
const API_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').origin;
  } catch {
    return window.location.origin;
  }
})();

/**
 * Returns a loadable URL for a real product photo, or null if there is none.
 * Also repairs upload URLs that would otherwise break in the browser:
 *  - relative paths ("/uploads/x.jpg" or "uploads/x.jpg") → served from the API origin
 *  - links saved while the backend's APP_URL was localhost → rewritten to the API origin
 *  - http:// links on an https page (blocked as mixed content) → upgraded to https://
 */
export function realImage(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed;
  try {
    parsed = /^https?:\/\//i.test(trimmed) ? new URL(trimmed) : new URL(trimmed.replace(/^\/?/, '/'), API_ORIGIN);
  } catch {
    return null;
  }

  if (DEMO_IMAGE_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) return null;

  const apiOrigin = new URL(API_ORIGIN);
  const apiIsLocal = LOCAL_HOSTS.includes(apiOrigin.hostname);
  if (LOCAL_HOSTS.includes(parsed.hostname) && !apiIsLocal) {
    parsed.protocol = apiOrigin.protocol;
    parsed.host = apiOrigin.host;
  }

  if (window.location.protocol === 'https:' && parsed.protocol === 'http:' && !LOCAL_HOSTS.includes(parsed.hostname)) {
    parsed.protocol = 'https:';
  }

  return parsed.toString();
}
