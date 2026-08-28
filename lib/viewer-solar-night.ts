import {
  approximateCoordinatesForIANATimeZone,
  isNightAtLocation,
} from '@/lib/sunPosition';

export type ViewerAnchor = { lat: number; lng: number };

/** Punto de referencia: geolocalización del usuario o capital de su zona IANA. */
export function resolveViewerAnchor(
  viewerLat?: number | null,
  viewerLng?: number | null
): ViewerAnchor | null {
  if (
    typeof viewerLat === 'number' &&
    typeof viewerLng === 'number' &&
    Number.isFinite(viewerLat) &&
    Number.isFinite(viewerLng) &&
    Math.abs(viewerLat) <= 90 &&
    Math.abs(viewerLng) <= 180
  ) {
    return { lat: viewerLat, lng: viewerLng };
  }
  if (typeof window === 'undefined') return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return approximateCoordinatesForIANATimeZone(tz);
  } catch {
    return null;
  }
}

/** `?hour=12` fuerza día, `?hour=22` fuerza noche (mismo criterio que MapFullPage). */
export function parseHourOverride(search?: string): number | undefined {
  if (typeof window === 'undefined' && search == null) return undefined;
  const q = search ?? window.location.search;
  const raw = new URLSearchParams(q).get('hour');
  if (raw == null) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : undefined;
}

function hasFiniteCoords(
  lat?: number | null,
  lng?: number | null
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * Noche en el lugar de quien mira: `isNightAtLocation` si hay coords;
 * si no, hora local del dispositivo (antes de las 7 o desde las 19).
 * `?hour=` fuerza el modo en pruebas.
 */
export function isViewerNightNow(
  viewerLat?: number | null,
  viewerLng?: number | null,
  date: Date = new Date(),
  hourOverride?: number
): boolean {
  const hour = hourOverride ?? parseHourOverride();
  if (hour != null) return hour < 7 || hour >= 19;
  if (hasFiniteCoords(viewerLat, viewerLng)) {
    return isNightAtLocation(viewerLat, viewerLng, date);
  }
  const h = date.getHours();
  return h < 7 || h >= 19;
}
