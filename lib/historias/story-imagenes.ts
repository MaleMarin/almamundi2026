/** Texto breve para `alt` de fotos enviadas. */
export const PHOTO_ALT_MAX = 300;

export type StoryImagen = {
  url: string;
  descripcion?: string;
  caption?: string;
  titulo?: string;
  /** Año exacto (`1985`) o inicio de década (`1980`) si `anioAprox`. */
  anio?: string;
  anioAprox?: boolean;
  lugar?: string;
};

export type SubmissionPhotoFicha = {
  nombre?: string;
  anio?: string;
  decada?: string;
  lugar?: string;
  alt?: string;
};

export function normalizePhotoAlt(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, PHOTO_ALT_MAX);
  return text || undefined;
}

function shortText(raw: unknown, max: number): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim().slice(0, max);
  return text || undefined;
}

export function imagenesFromUrlsAndAlts(urls: string[], alts?: unknown): StoryImagen[] {
  return imagenesFromSubmissionPhotos(urls, undefined, alts);
}

export function imagenesFromSubmissionPhotos(
  urls: string[],
  fichas?: SubmissionPhotoFicha[] | null,
  alts?: unknown
): StoryImagen[] {
  const altList = Array.isArray(alts) ? alts : [];
  const fichaList = Array.isArray(fichas) ? fichas : [];
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, i) => {
      const ficha = fichaList[i];
      const titulo = shortText(ficha?.nombre, 80);
      const lugar = shortText(ficha?.lugar, 80);
      const anioExacto = shortText(ficha?.anio, 4);
      const decada = shortText(ficha?.decada, 4);
      const anio = anioExacto || decada;
      const anioAprox = !anioExacto && Boolean(decada);
      const descripcion = normalizePhotoAlt(ficha?.alt ?? altList[i]);
      const caption = [titulo, anioAprox && decada ? `años ${decada}` : anio, lugar]
        .filter(Boolean)
        .join(' · ');
      return {
        url,
        ...(titulo ? { titulo } : {}),
        ...(anio ? { anio } : {}),
        ...(anioAprox ? { anioAprox: true } : {}),
        ...(lugar ? { lugar } : {}),
        ...(descripcion ? { descripcion } : {}),
        ...(caption ? { caption } : {}),
      };
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
    const descripcion = normalizePhotoAlt(rec.descripcion);
    const caption = shortText(rec.caption, 240);
    const titulo = shortText(rec.titulo, 80);
    const anio = shortText(rec.anio, 4);
    const lugar = shortText(rec.lugar, 80);
    const anioAprox = rec.anioAprox === true && Boolean(anio);
    out.push({
      url,
      ...(descripcion ? { descripcion } : {}),
      ...(caption ? { caption } : {}),
      ...(titulo ? { titulo } : {}),
      ...(anio ? { anio } : {}),
      ...(anioAprox ? { anioAprox: true } : {}),
      ...(lugar ? { lugar } : {}),
    });
  }
  return out.length ? out : undefined;
}

/** Texto que alimenta las franjas: nombre, lugar y descripción de cada foto. El año no entra. */
export function photoStripeSourceText(
  photos: Array<{
    titulo?: string;
    nombre?: string;
    lugar?: string;
    descripcion?: string;
    alt?: string;
  }>
): string {
  return photos
    .map((photo) =>
      [photo.titulo || photo.nombre, photo.lugar, photo.descripcion || photo.alt]
        .map((part) => (typeof part === 'string' ? part.replace(/\s+/g, ' ').trim() : ''))
        .filter(Boolean)
        .join('. ')
    )
    .filter(Boolean)
    .join('\n');
}
