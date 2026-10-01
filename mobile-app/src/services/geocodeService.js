import { Platform } from 'react-native';

// Free geocoding via OpenStreetMap Nominatim (no API key required).
// Requests are made from the app (not from inside the map WebView) so we can
// send an identifying User-Agent as the Nominatim usage policy asks, and the
// results are cached so each address is only looked up once per session.

export const DHAKA_CENTER = { lat: 23.8103, lon: 90.4125 };

const cache = new Map();

const lookup = async (q) => {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bd&q=' +
    encodeURIComponent(q);
  const headers = { Accept: 'application/json', 'Accept-Language': 'bn,en' };
  // Browsers forbid setting User-Agent; native platforms need it for Nominatim.
  if (Platform.OS !== 'web') headers['User-Agent'] = 'BhangariExchange/1.0 (university project)';

  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
};

/**
 * Geocode a free-text address in Bangladesh.
 * Tries the full address first, then progressively shorter versions
 * (area / city) so a partially-known address still lands nearby.
 * @returns {Promise<{lat:number, lon:number, exact:boolean}>}
 */
export const geocodeAddress = async (address) => {
  const clean = String(address || '').replace(/\s+/g, ' ').trim();
  if (!clean) return { ...DHAKA_CENTER, exact: false };
  if (cache.has(clean)) return cache.get(clean);

  const parts = clean.split(/[,،]/).map((p) => p.trim()).filter(Boolean);
  const candidates = [clean];
  if (parts.length > 2) candidates.push(parts.slice(-2).join(', '));
  if (parts.length > 1) candidates.push(parts[parts.length - 1]);

  let result = null;
  for (let i = 0; i < candidates.length && !result; i += 1) {
    try {
      const found = await lookup(candidates[i]);
      if (found) result = { ...found, exact: i === 0 };
    } catch (error) {
      // network error — try the next candidate / fall back to Dhaka
    }
  }

  const final = result || { ...DHAKA_CENTER, exact: false };
  cache.set(clean, final);
  return final;
};

/** Universal link that opens Google Maps (app or browser) at an address */
export const mapsSearchUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Bangladesh`)}`;
