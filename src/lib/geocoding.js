/**
 * Geocodes a location text string using the free Nominatim OpenStreetMap API.
 * Returns { lat, lng } or null if the location could not be found.
 * No API key required.
 * Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
export async function geocodeLocation(locationText) {
  if (!locationText?.trim()) return null;
  try {
    const encoded = encodeURIComponent(locationText.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'ArtifyApp/1.0',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Fetches live coordinates from the device/browser geolocation API.
 * Returns { lat, lng } or throws when unavailable/denied.
 */
export function getDeviceLocation(options = {}) {
  const config = {
    timeout: 10000,
    enableHighAccuracy: false,
    maximumAge: 0,
    ...options,
  };

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        reject(err);
      },
      config
    );
  });
}

/**
 * Calculates the great-circle distance between two WGS84 coordinates
 * using the Haversine formula. Returns distance in kilometers.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
