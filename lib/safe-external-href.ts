/**
 * Href http(s) seguro para texto de usuarios (canción, antecedentes, etc.).
 * No acepta javascript:, data: ni otros protocolos.
 */
export function parseSafeHttpHref(raw: string, maxLen = 2048): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    return parsed.href.slice(0, maxLen);
  } catch {
    return null;
  }
}

export type SafeTextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string };

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCT = /[.,;:!?)\]}'"]+$/;

/**
 * Parte un párrafo en texto y links http(s) validados.
 * El resto del texto queda igual; no interpreta HTML.
 */
export function splitTextWithSafeHttpUrls(text: string): SafeTextPart[] {
  const src = text;
  const parts: SafeTextPart[] = [];
  const re = new RegExp(URL_IN_TEXT.source, URL_IN_TEXT.flags);
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    const start = match.index;
    if (start > last) parts.push({ type: 'text', value: src.slice(last, start) });
    const full = match[0];
    const punct = full.match(TRAILING_PUNCT)?.[0] ?? '';
    const candidate = punct ? full.slice(0, -punct.length) : full;
    const href = parseSafeHttpHref(candidate);
    if (href) {
      parts.push({ type: 'link', value: candidate, href });
      if (punct) parts.push({ type: 'text', value: punct });
    } else {
      parts.push({ type: 'text', value: full });
    }
    last = start + full.length;
  }
  if (last < src.length) parts.push({ type: 'text', value: src.slice(last) });
  return parts.length > 0 ? parts : [{ type: 'text', value: src }];
}
