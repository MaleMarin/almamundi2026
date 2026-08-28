/**
 * Construye props de TextoReader / FotoAlbum desde StoryPoint (cliente, sin servidor).
 * Misma lógica que app/historias/[id]/texto y .../foto.
 */
import type { HistoriaFoto } from '@/components/historia/FotoAlbum';
import type { HistoriaTexto } from '@/components/historia/TextoReader';
import { demoStoryFieldsFromPoint } from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';
import { storyUbicacionLabel } from '@/lib/historias/story-ubicacion';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#B53514" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#FF4A1C" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function buildImagenesFromStory(s: StoryPoint): { url: string; caption?: string; descripcion?: string }[] {
  const sp = s as StoryPoint & {
    images?: string[];
    imagenes?: { url: string; caption?: string; descripcion?: string }[];
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
  const ubicacion = storyUbicacionLabel(s);
  const wordCount = contenido.split(/\s+/).filter(Boolean).length;
  const tiempoLectura = Math.ceil(wordCount / 200);
  const demoStory = demoStoryFieldsFromPoint(s);
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Sin título',
    subtitulo: s.subtitle ?? s.description,
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
    ...(s.cancionRelacionada ? { cancionRelacionada: s.cancionRelacionada } : {}),
    ...(s.antecedentes ? { antecedentes: s.antecedentes } : {}),
    ...(demoStory ? { demoStory } : {}),
  };
}

export function storyPointToHistoriaFotoModal(s: StoryPoint): HistoriaFoto | null {
  const imagenes = buildImagenesFromStory(s);
  if (imagenes.length === 0) return null;
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = storyUbicacionLabel(s);
  const demoStory = demoStoryFieldsFromPoint(s);
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Sin título',
    subtitulo: s.subtitle ?? s.description,
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
    ...(s.cancionRelacionada ? { cancionRelacionada: s.cancionRelacionada } : {}),
    ...(s.antecedentes ? { antecedentes: s.antecedentes } : {}),
    ...(demoStory ? { demoStory } : {}),
  };
}
