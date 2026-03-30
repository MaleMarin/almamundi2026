/**
 * Construye props de TextoReader / FotoAlbum desde StoryPoint (cliente, sin servidor).
 * Misma lógica que app/historias/[id]/texto y .../foto.
 */
import type { HistoriaFoto } from '@/components/historia/FotoAlbum';
import type { HistoriaTexto } from '@/components/historia/TextoReader';
import type { StoryPoint } from '@/lib/map-data/stories';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function buildImagenesFromStory(s: StoryPoint): { url: string; caption?: string }[] {
  const sp = s as StoryPoint & {
    images?: string[];
    imagenes?: { url: string; caption?: string }[];
    photos?: { url: string; name?: string; date?: string }[];
  };
  if (sp.imagenes?.length) return sp.imagenes;
  if (sp.photos?.length)
    return sp.photos.map((p) => ({ url: p.url, caption: p.name ?? p.date }));
  if (sp.images?.length) return sp.images.map((url) => ({ url }));
  if (s.imageUrl) return [{ url: s.imageUrl }];
  return [];
}

export function storyPointToHistoriaTextoModal(s: StoryPoint): HistoriaTexto | null {
  const contenido = (
    s.body ??
    (s as StoryPoint & { content?: string }).content ??
    ''
  ).trim();
  if (!contenido) return null;
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
  const wordCount = contenido.split(/\s+/).filter(Boolean).length;
  const tiempoLectura = Math.ceil(wordCount / 200);
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Sin título',
    subtitulo: s.subtitle ?? s.description ?? ubicacion,
    contenido,
    tiempoLectura,
    fecha: s.publishedAt ?? '',
    autor: {
      nombre,
      avatar:
        s.author?.avatar ??
        (s as StoryPoint & { authorAvatar?: string }).authorAvatar ??
        defaultAvatar(nombre),
      ubicacion,
      bio: s.author?.bio,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
  };
}

export function storyPointToHistoriaFotoModal(s: StoryPoint): HistoriaFoto | null {
  const imagenes = buildImagenesFromStory(s);
  if (imagenes.length === 0) return null;
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Sin título',
    subtitulo: s.subtitle ?? s.description ?? ubicacion,
    fecha: s.publishedAt ?? '',
    imagenes,
    autor: {
      nombre,
      avatar:
        s.author?.avatar ??
        (s as StoryPoint & { authorAvatar?: string }).authorAvatar ??
        defaultAvatar(nombre),
      ubicacion,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
  };
}
