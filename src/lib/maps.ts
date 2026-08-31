import type { WorkLocation } from '@/types';

/**
 * Joins location parts into one line, dropping any part already contained in
 * what has been added so far.
 *
 * Addresses are frequently written as "Venue, City, State", so a naive join
 * with the separate `city` field yields "…, Kochi, Kerala, Kochi". Comparing
 * on substring rather than equality avoids that.
 */
function joinParts(parts: Array<string | undefined | null>): string {
  const kept: string[] = [];

  for (const raw of parts) {
    const part = raw?.trim();
    if (!part) continue;

    const needle = part.toLowerCase();
    const alreadyCovered = kept.some((existing) => {
      const hay = existing.toLowerCase();
      return hay === needle || hay.includes(needle) || needle.includes(hay);
    });

    if (!alreadyCovered) kept.push(part);
  }

  return kept.join(', ');
}

/** The text a maps search should be run against for this location. */
function searchQuery(location: Partial<WorkLocation>): string {
  return joinParts([location.venue, location.address, location.city]);
}

const hasCoords = (
  location: Partial<WorkLocation>,
): location is Partial<WorkLocation> & { lat: number; lng: number } =>
  typeof location.lat === 'number' &&
  typeof location.lng === 'number' &&
  Number.isFinite(location.lat) &&
  Number.isFinite(location.lng);

/**
 * Builds the best available Google Maps link for a work location.
 *
 * Preference order:
 *  1. An explicit `mapUrl` the admin pasted (a dropped pin beats a text search).
 *  2. `lat,lng` coordinates, which resolve to the exact point.
 *  3. A search over "venue, address, city" — reliable for a named venue.
 *
 * Returns null only when there is nothing at all to search for.
 */
export function buildMapsUrl(location?: Partial<WorkLocation> | null): string | null {
  if (!location) return null;

  if (location.mapUrl && /^https?:\/\//i.test(location.mapUrl)) {
    return location.mapUrl;
  }

  if (hasCoords(location)) {
    return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  }

  const query = searchQuery(location);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

/** Turn-by-turn directions to the venue, offered once a booking is confirmed. */
export function buildDirectionsUrl(location?: Partial<WorkLocation> | null): string | null {
  if (!location) return null;

  if (hasCoords(location)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  }

  const query = searchQuery(location);
  return query
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
    : null;
}

/** Single-line address for display, without repeating the venue or city. */
export function formatAddress(location?: Partial<WorkLocation> | null): string {
  if (!location) return '';
  return joinParts([location.address, location.city]);
}

/**
 * Extracts `lat,lng` from a pasted Google Maps URL so an admin can simply
 * copy a link from the app. Handles the common shapes:
 *   .../@9.9658,76.2422,17z
 *   ...?q=9.9658,76.2422
 *   .../place/Name/@9.9658,76.2422
 *   ...!3d9.9658!4d76.2422
 */
export function parseCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /[?&]query=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /[?&]destination=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }

  return null;
}

/** An embeddable map preview. Uses the keyless `output=embed` endpoint. */
export function buildEmbedUrl(location?: Partial<WorkLocation> | null): string | null {
  if (!location) return null;

  if (hasCoords(location)) {
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`;
  }

  const query = searchQuery(location);
  return query ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed` : null;
}
