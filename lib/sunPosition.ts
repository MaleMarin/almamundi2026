/**
 * Determina si en una ubicación (lat, lng) es de noche según la posición del sol.
 * Usa la misma convención que el terminator del globo (UTC, declinación solar).
 */

function sunDirection(date: Date): { x: number; y: number; z: number } {
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
  const ha = (Math.PI / 12) * (utcHours - 12);
  const x = Math.cos(decl) * Math.cos(ha);
  const y = Math.sin(decl);
  const z = Math.cos(decl) * Math.sin(ha);
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/**
 * true si en (lat, lng) el sol está por debajo del horizonte (noche).
 * Coordenadas: lat/lng en grados; convención del globo Y = norte.
 */
export function isNightAtLocation(lat: number, lng: number, date: Date): boolean {
  const sun = sunDirection(date);
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const nx = Math.cos(latRad) * Math.cos(lngRad);
  const ny = Math.sin(latRad);
  const nz = Math.cos(latRad) * Math.sin(lngRad);
  const dot = sun.x * nx + sun.y * ny + sun.z * nz;
  return dot <= 0;
}
