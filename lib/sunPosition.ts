/**
 * Posición solar aproximada (UTC) y terminador coherente con el globo (eje Y = norte).
 * Sin dependencias pesadas: declinación + ángulo horario, suficiente para HUD y luces del mapa.
 */

export type SunVector3 = { x: number; y: number; z: number };

function clamp01Cos(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

/** Vector unitario sol → convención compartida con shaders del globo (Three / GlobeV2). */
export function sunDirectionUtc(date: Date): SunVector3 {
  const d = new Date(date.getTime());
  const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = (d.getTime() - start) / 86400000;
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);
  const decl =
    0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.00148 * Math.sin(3 * gamma);
  // Hora solar en el meridiano de referencia: al avanzar UTC tras el mediodía en Greenwich,
  // el subsolar se desplaza hacia el oeste (América). (utcHours - 12) invertía longitud ~180°.
  const ha = (Math.PI / 12) * (12 - utcHours);
  const x = Math.cos(decl) * Math.cos(ha);
  const y = Math.sin(decl);
  const z = Math.cos(decl) * Math.sin(ha);
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/** Punto subsolar (lat/lng grados) donde el sol está en el cenit en este instante. */
export function subsolarGeographicDegrees(date: Date): { lat: number; lng: number } {
  const s = sunDirectionUtc(date);
  const lat = (Math.asin(clamp01Cos(s.y)) * 180) / Math.PI;
  const lng = (Math.atan2(s.z, s.x) * 180) / Math.PI;
  return { lat, lng };
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
  const sun = sunDirectionUtc(date);
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const nx = Math.cos(latRad) * Math.cos(lngRad);
  const ny = Math.sin(latRad);
  const nz = Math.cos(latRad) * Math.sin(lngRad);
  const dot = sun.x * nx + sun.y * ny + sun.z * nz;
  return dot <= 0;
}

/** Coeficiente cívulo [-1..1]: -1 noche, +1 mediodía, bandas crepusculares cerca de 0. */
export function sunElevationCosineAt(lat: number, lng: number, date: Date): number {
  const sun = sunDirectionUtc(date);
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const nx = Math.cos(latRad) * Math.cos(lngRad);
  const ny = Math.sin(latRad);
  const nz = Math.cos(latRad) * Math.sin(lngRad);
  return sun.x * nx + sun.y * ny + sun.z * nz;
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
