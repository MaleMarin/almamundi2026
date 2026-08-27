/** Texto libre de "Extras (opcional)"; no incluye el relleno de `context`. */
export const ANTECEDENTES_MAX = 2000;

export function normalizeAntecedentes(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, ANTECEDENTES_MAX);
  return text || undefined;
}
