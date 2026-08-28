/** Texto breve para `alt` de fotos enviadas. */
export const PHOTO_ALT_MAX = 300;

export type StoryImagen = {
  url: string;
  descripcion?: string;
  caption?: string;
};

export function normalizePhotoAlt(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, PHOTO_ALT_MAX);
  return text || undefined;
}

export function imagenesFromUrlsAndAlts(urls: string[], alts?: unknown): StoryImagen[] {
  const list = Array.isArray(alts) ? alts : [];
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, i) => {
      const descripcion = normalizePhotoAlt(list[i]);
      return descripcion ? { url, descripcion } : { url };
    });
}

export function parseStoryImagenes(raw: unknown): StoryImagen[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: StoryImagen[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === 'string' ? rec.url.trim() : '';
    if (!url) continue;
    const descripcion = normalizePhotoAlt(rec.descripcion ?? rec.caption);
    const caption = typeof rec.caption === 'string' ? rec.caption.trim() : undefined;
    out.push({
      url,
      ...(descripcion ? { descripcion } : {}),
      ...(caption ? { caption } : {}),
    });
  }
  return out.length ? out : undefined;
}
