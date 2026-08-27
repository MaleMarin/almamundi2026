/** Campo opcional de envío: nombre de canción o enlace (Spotify, YouTube, etc.). */
export const CANCION_RELACIONADA_MAX = 300;

export function normalizeCancionRelacionada(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, CANCION_RELACIONADA_MAX);
  return text || undefined;
}

/**
 * Si el texto es una URL http(s) válida, devuelve el href seguro.
 * No acepta javascript:, data: ni otros protocolos.
 */
export function parseCancionRelacionadaHref(text: string): string | null {
  try {
    const parsed = new URL(text.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    return parsed.href.slice(0, CANCION_RELACIONADA_MAX);
  } catch {
    return null;
  }
}
