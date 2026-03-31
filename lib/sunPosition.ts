/**
 * Posición solar (UTC) y terminador alineados con el globo Three.js / `latLngToCartesianThreeJS`.
 * GMST + Sol (Meeus, baja precisión) → subsolar geográfico → vector ECEF hacia el Sol.
 */

import { latLngToCartesianThreeJS } from '@/lib/globe-coords';

export type SunVector3 = { x: number; y: number; z: number };

function clamp01Cos(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Día juliano UTC (fraccionario) a partir del instante `Date` (ms desde epoch). */
export function julianDateUtc(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Tiempo sidéreo medio de Greenwich (rad), 0..2π.
 * IAU-style polinomio en T respecto a J2000 (Meeus cap. 12; precisión ~1″ para UI).
 */
export function greenwichMeanSiderealTimeRad(date: Date): number {
  const jd = julianDateUtc(date);
  const T = (jd - 2451545.0) / 36525;
  let gmstDeg =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  gmstDeg = ((gmstDeg % 360) + 360) % 360;
  return gmstDeg * DEG2RAD;
}

/** Ascensión recta y declinación medias del Sol (rad). */
export function sunRightAscensionDeclinationRad(date: Date): { raRad: number; decRad: number } {
  const jd = julianDateUtc(date);
  const T = (jd - 2451545.0) / 36525;
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = ((L0 % 360) + 360) % 360;
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = ((M % 360) + 360) % 360;
  const Mrad = M * DEG2RAD;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const lambda = ((L0 + C) % 360) * DEG2RAD;
  const eps =
    (23.439291111111 - 0.0130041666667 * T - 1.6388888889e-7 * T * T + 5.0361111111e-10 * T * T * T) *
    DEG2RAD;
  const raRad = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const decRad = Math.asin(clamp01Cos(Math.sin(eps) * Math.sin(lambda)));
  return { raRad, decRad };
}

function wrapPi(r: number): number {
  let x = r;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

/** Subsolar geográfico (rad): lat = declinación, lon este desde Greenwich. */
export function subsolarGeographicRad(date: Date): { latRad: number; lonRad: number } {
  const gmst = greenwichMeanSiderealTimeRad(date);
  const { raRad, decRad } = sunRightAscensionDeclinationRad(date);
  const ha = wrapPi(gmst - raRad);
  const lonRad = wrapPi(-ha);
  return { latRad: decRad, lonRad };
}

/**
 * Vector unitario Tierra → Sol en el marco fijo al cuerpo terrestre,
 * misma convención que `latLngToCartesianThreeJS` (textura / bits / GlobeV2).
 */
export function sunUnitVectorTowardSunEcef(date: Date): SunVector3 {
  const { latRad, lonRad } = subsolarGeographicRad(date);
  const latDeg = latRad * RAD2DEG;
  const lonDeg = lonRad * RAD2DEG;
  const p = latLngToCartesianThreeJS(latDeg, lonDeg, 1);
  const len = Math.hypot(p.x, p.y, p.z) || 1;
  return { x: p.x / len, y: p.y / len, z: p.z / len };
}

/**
 * Rotación Y del grupo `planetSpin` (rad): alinea el meridiano 0 de la textura con GMST.
 * `textureMeridianOffsetRad` corrige desfase textura vs meridiano astronómico (típ. 0).
 */
export function earthGreenwichSpinYRadFromUtc(date: Date, textureMeridianOffsetRad = 0): number {
  return greenwichMeanSiderealTimeRad(date) + textureMeridianOffsetRad;
}

/** @deprecated nombre histórico — equivale a `sunUnitVectorTowardSunEcef` (marco textura / ECEF). */
export function sunDirectionUtc(date: Date): SunVector3 {
  return sunUnitVectorTowardSunEcef(date);
}

/** Punto subsolar (lat/lng grados) donde el sol está en el cenit en este instante. */
export function subsolarGeographicDegrees(date: Date): { lat: number; lng: number } {
  const { latRad, lonRad } = subsolarGeographicRad(date);
  return { lat: latRad * RAD2DEG, lng: lonRad * RAD2DEG };
}

/**
 * Ángulo (grados) para un linear-gradient CSS que aproxima el terminador en planta
 * (no sigue la rotación del usuario sobre el globo; refuerza lectura del ciclo día/noche).
 */
export function terminatorCssGradientAngleDeg(date: Date): number {
  const { lng } = subsolarGeographicDegrees(date);
  return 90 + lng;
}

/**
 * true si en (lat, lng) el sol está por debajo del horizonte (noche astronómica simple: dot ≤ 0).
 * Coordenadas en grados; convención del globo Y = norte.
 */
export function isNightAtLocation(lat: number, lng: number, date: Date): boolean {
  const sun = sunUnitVectorTowardSunEcef(date);
  const n = latLngToCartesianThreeJS(lat, lng, 1);
  const dot = sun.x * n.x + sun.y * n.y + sun.z * n.z;
  return dot <= 0;
}

/** Coeficiente cívulo [-1..1]: -1 noche, +1 mediodía, bandas crepusculares cerca de 0. */
export function sunElevationCosineAt(lat: number, lng: number, date: Date): number {
  const sun = sunUnitVectorTowardSunEcef(date);
  const n = latLngToCartesianThreeJS(lat, lng, 1);
  return sun.x * n.x + sun.y * n.y + sun.z * n.z;
}

export type MapSyncCaption = {
  headline: string;
  detail: string;
};

/**
 * Capital o ciudad representativa por zona IANA (aprox.) para día/noche solar en UI del globo.
 * Si la zona no está listada, el caller puede usar ventana horaria fija.
 */
export function approximateCoordinatesForIANATimeZone(timeZone: string): { lat: number; lng: number } | null {
  const map: Record<string, { lat: number; lng: number }> = {
    'America/Santiago': { lat: -33.4489, lng: -70.6693 },
    'America/Punta_Arenas': { lat: -53.1638, lng: -70.9171 },
    'America/Argentina/Buenos_Aires': { lat: -34.6037, lng: -58.3816 },
    'America/Montevideo': { lat: -34.9011, lng: -56.1645 },
    'America/Sao_Paulo': { lat: -23.5505, lng: -46.6333 },
    'America/Lima': { lat: -12.0464, lng: -77.0428 },
    'America/Bogota': { lat: 4.711, lng: -74.0721 },
    'America/Caracas': { lat: 10.4806, lng: -66.9036 },
    'America/La_Paz': { lat: -16.5, lng: -68.15 },
    'America/Mexico_City': { lat: 19.4326, lng: -99.1332 },
    'America/Cancun': { lat: 21.1619, lng: -86.8515 },
    'America/Guatemala': { lat: 14.6349, lng: -90.5069 },
    'America/Havana': { lat: 23.1136, lng: -82.3666 },
    'America/Jamaica': { lat: 18.0179, lng: -76.8099 },
    'America/Panama': { lat: 8.9824, lng: -79.5199 },
    'America/New_York': { lat: 40.7128, lng: -74.006 },
    'America/Chicago': { lat: 41.8781, lng: -87.6298 },
    'America/Denver': { lat: 39.7392, lng: -104.9903 },
    'America/Phoenix': { lat: 33.4484, lng: -112.074 },
    'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
    'America/Vancouver': { lat: 49.2827, lng: -123.1207 },
    'America/Toronto': { lat: 43.6532, lng: -79.3832 },
    'America/Halifax': { lat: 44.6488, lng: -63.5752 },
    'America/Anchorage': { lat: 61.2181, lng: -149.9003 },
    'Pacific/Honolulu': { lat: 21.3069, lng: -157.8583 },
    'Europe/Madrid': { lat: 40.4168, lng: -3.7038 },
    'Europe/London': { lat: 51.5074, lng: -0.1278 },
    'Europe/Paris': { lat: 48.8566, lng: 2.3522 },
    'UTC': { lat: 0, lng: 0 },
    'Etc/UTC': { lat: 0, lng: 0 },
  };
  return map[timeZone] ?? null;
}

/**
 * Texto bajo el HUD del mapa: sincronización con tiempo real y penumbra (Chile u otra zona).
 */
export function formatMapRealtimeSyncCaption(
  now: Date,
  options?: { userLat?: number | null; userLng?: number | null }
): MapSyncCaption {
  let timeZone: string;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = 'UTC';
  }
  const inChile = timeZone === 'America/Santiago';
  const lat = options?.userLat ?? (inChile ? -33.4489 : null);
  const lng = options?.userLng ?? (inChile ? -70.6693 : null);

  const timeFmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: inChile ? 'America/Santiago' : timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeStr = timeFmt.format(now);

  const night =
    lat != null && lng != null ? isNightAtLocation(lat, lng, now) : null;

  const headline = 'Sincronizado con tu tiempo real';

  let detail: string;
  if (inChile) {
    detail =
      night === true
        ? `Actualmente en Chile: ${timeStr} — Hemisferio Sur en penumbra nocturna`
        : night === false
          ? `Actualmente en Chile: ${timeStr} — día en tu meridiano`
          : `Actualmente en Chile: ${timeStr}`;
  } else if (lat != null && lng != null && night != null) {
    const place = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
    detail = `Tu zona (${place}): ${timeStr} — ${night ? 'noche en tu ubicación' : 'día en tu ubicación'}`;
  } else {
    const place = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
    detail = `Tu zona (${place}): ${timeStr} — terminador solar según hora UTC`;
  }

  return { headline, detail };
}
