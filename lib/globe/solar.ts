/**
 * Dirección solar aproximada (UTC) para iluminación tipo “rayos paralelos”.
 * Declinación solar vía serie de Fourier (Spencer / NOAA aproximación común en gráficos).
 * Ángulo horario: mediodía solar en Greenwich cuando UTC = 12h → ha = (12 - utcHours) * π/12.
 */

export type SolarUnitVector = { x: number; y: number; z: number };

function normalizeSolar(x: number, y: number, z: number): SolarUnitVector {
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/** Hora decimal UTC [0,24). */
export function utcDecimalHours(date: Date): number {
  return date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
}

/** Día del año fraccionario (1-based). */
export function fractionalDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return (date.getTime() - start) / 86400000;
}

/** Declinación solar (radianes). */
export function solarDeclinationRadians(date: Date): number {
  const utcHours = utcDecimalHours(date);
  const dayOfYear = fractionalDayOfYear(date);
  const gamma = (2 * Math.PI) / 365 * (dayOfYear - 1 + (utcHours - 12) / 24);
  return (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  );
}

/** Ángulo horario en radianes (0 en antimeridiano solar aprox.). */
export function hourAngleRadians(date: Date): number {
  const utcHours = utcDecimalHours(date);
  return (Math.PI / 12) * (12 - utcHours);
}

/**
 * Vector unitario apuntando del centro de la Tierra hacia el Sol.
 * Ejes: X/Y/Z alineados con convención del globo del proyecto (Y = norte).
 */
export function getSolarDirectionUnit(date: Date): SolarUnitVector {
  const decl = solarDeclinationRadians(date);
  const ha = hourAngleRadians(date);
  const x = Math.cos(decl) * Math.cos(ha);
  const y = Math.sin(decl);
  const z = Math.cos(decl) * Math.sin(ha);
  return normalizeSolar(x, y, z);
}
