/** Año público de una historia, pregunta o respuesta: solo el año, nunca la fecha exacta. */
export function anioDe(value: unknown): string {
  let ms = NaN;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    ms = (value as { toMillis: () => number }).toMillis();
  } else if (value && typeof value === 'object' && '_seconds' in value) {
    ms = Number((value as { _seconds: number })._seconds) * 1000;
  } else if (typeof value === 'number' || typeof value === 'string') {
    ms = new Date(value).getTime();
  }
  return Number.isFinite(ms) && ms > 0 ? String(new Date(ms).getFullYear()) : '';
}

/** «Valparaíso, Chile · 2026». */
export function conAnio(lugar: string, anio?: string | null): string {
  return [lugar, anio ?? ''].filter(Boolean).join(' · ');
}
