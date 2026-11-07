/** Texto libre de "Extras (opcional)"; no incluye el relleno de `context`. */
export const ANTECEDENTES_MAX = 2000;

export function normalizeAntecedentes(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, ANTECEDENTES_MAX);
  return text || undefined;
}

const PUBLIC_NOTE_MARKER = 'Extras / contexto';

/** El mensaje para el equipo no forma parte del relato público. Solo quita el bloque marcado o una línea que sea exactamente ese mensaje. */
const RELLENO_CONTEXTO = '(Envío AlmaMundi, sin descripción ampliada.)';

function sinEspacios(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Historias publicadas antes del 7 nov 2026: el texto público juntaba el campo técnico `context`
 * (los primeros 500 caracteres del relato) con el relato completo, así que el comienzo se repetía.
 * También podía quedar el relleno «título · lugar (Envío AlmaMundi, sin descripción ampliada.)».
 */
export function quitarRepeticionDelInicio(text: string): string {
  let out = text;
  const relleno = out.indexOf(RELLENO_CONTEXTO);
  if (relleno >= 0) out = out.slice(relleno + RELLENO_CONTEXTO.length).trim();
  for (let corte = out.indexOf('\n\n'); corte > 0 && corte <= 2200; corte = out.indexOf('\n\n', corte + 2)) {
    const antes = sinEspacios(out.slice(0, corte));
    const despues = out.slice(corte + 2);
    if (antes.length >= 30 && sinEspacios(despues).startsWith(antes)) return despues.trim();
  }
  // Relato muy corto: «relato · título · lugar · relato».
  const partes = out.split('\n\n');
  if (partes.length >= 3 && partes[1]!.includes(' · ')) {
    const primero = sinEspacios(partes[0]!);
    if (primero && primero === sinEspacios(partes.slice(2).join('\n\n'))) return partes[0]!.trim();
  }
  return out;
}

export function omitAntecedentesFromPublicText(text: string, note?: string): string {
  let out = quitarRepeticionDelInicio(text);
  const extra = note?.trim();
  if (extra) {
    out = out.split(`${PUBLIC_NOTE_MARKER}\n${extra}`).join('');
    out = out
      .split('\n')
      .filter((line) => line.trim() !== extra)
      .join('\n');
  }
  out = out.split(PUBLIC_NOTE_MARKER).join('');
  out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  // Lo que quedaba del relleno técnico «título · lugar» (sin relato) no es texto de la persona.
  if (!out.includes('\n') && out.length <= 160 && out.includes(' · ') && !/[.!?…]/.test(out)) return '';
  return out;
}
