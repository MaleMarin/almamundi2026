import {
  approximateCoordinatesForIANATimeZone,
  sunDayFactorAtLocation,
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

/**
 * Noche perceptible en la ubicación del usuario (terminador + luces de ciudad + HUD).
 * Umbral bajo 0.22 incluye crepúsculo para que coincida con “está oscuro” en Chile, etc.
 */
export function isViewerNightNow(
  viewerLat?: number | null,
  viewerLng?: number | null,
  date: Date = new Date()
): boolean {
  const anchor = resolveViewerAnchor(viewerLat, viewerLng);
  if (anchor) {
    return sunDayFactorAtLocation(anchor.lat, anchor.lng, date) < 0.22;
  }
  const h = date.getHours();
  return h >= 20 || h < 6;
}
