import { resolveViewerAnchor } from '@/lib/viewer-solar-night';

/**
 * Punto de vista por defecto del globo: Pacífico central con Norteamérica occidental hacia un lado.
 * Usado en MapCanvas (onGlobeReady) y MapFullPage (reset, entrada, base orbit).
 */
export const GLOBE_PACIFIC_POV = { lat: 30, lng: -142, altitude: 2.35 } as const;

/** Órbita “cerca” tras la animación de entrada / botón volver. */
export const GLOBE_PACIFIC_POV_ORBIT = { lat: 30, lng: -142, altitude: 1.28 } as const;

/** Primera toma del acercamiento (cinema): cámara más lejana. */
export const GLOBE_PACIFIC_POV_FAR = { lat: 30, lng: -142, altitude: 2.95 } as const;

/** Encuadre inicial por huso IANA (sin GPS). Si no hay zona, Pacífico. */
export function globePovForViewerTimeZone(altitude: number): {
  lat: number;
  lng: number;
  altitude: number;
} {
  const a = resolveViewerAnchor();
  if (a) return { lat: a.lat, lng: a.lng, altitude };
  return { lat: GLOBE_PACIFIC_POV.lat, lng: GLOBE_PACIFIC_POV.lng, altitude };
}
