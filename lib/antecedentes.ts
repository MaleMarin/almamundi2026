/** Texto libre de "Extras (opcional)"; no incluye el relleno de `context`. */
export const ANTECEDENTES_MAX = 2000;

export function normalizeAntecedentes(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, ANTECEDENTES_MAX);
  return text || undefined;
}

const PUBLIC_NOTE_MARKER = 'Extras / contexto';

/** El mensaje para el equipo no forma parte del relato público. */
export function omitAntecedentesFromPublicText(text: string, note?: string): string {
  let out = text;
  const extra = note?.trim();
  if (extra) {
    out = out.split(`${PUBLIC_NOTE_MARKER}\n${extra}`).join('');
    out = out.split(extra).join('');
  }
  out = out.split(PUBLIC_NOTE_MARKER).join('');
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
