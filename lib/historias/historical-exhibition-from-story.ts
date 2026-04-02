import type { HistoricalExhibitionStory } from '@/lib/historias/historical-exhibition-demo';
import { formatPublishedAtEsStable } from '@/lib/historias/format-published-es-stable';
import type { StoryPoint } from '@/lib/map-data/stories';

const PLACEHOLDER_THUMB =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#2a2a32" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8b8b9a">Sin imagen</text></svg>'
  );

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(', ') || s.label || '';
}

function tagsFromStory(s: StoryPoint): string[] {
  if (s.tags && s.tags.length > 0) return s.tags.slice(0, 6);
  const t: string[] = [];
  if (s.topic) t.push(s.topic);
  if (s.format) t.push(s.format);
  if (t.length === 0) t.push('video');
  return t;
}

/** Historias del mapa / API → tarjetas del carrusel exposición (Swiper). */
export function storyPointToHistoricalExhibitionStory(
  s: StoryPoint
): HistoricalExhibitionStory {
  const raw =
    s.imageUrl ??
    s.thumbnailUrl ??
    (s as Record<string, unknown>).image ??
    (s as Record<string, unknown>).thumbnail ??
    (s as Record<string, unknown>).coverImage ??
    (s as Record<string, unknown>).videoThumbnail;
  const imagen =
    typeof raw === 'string' && raw.trim() ? raw.trim() : PLACEHOLDER_THUMB;
  const name = s.authorName ?? s.author?.name ?? '—';
  const rawAvatar = s.author?.avatar ?? s.authorAvatar ?? '';
  const foto =
    typeof rawAvatar === 'string' && rawAvatar.trim()
      ? rawAvatar.trim()
      : defaultAvatar(name);
  const lugar = formatPlace(s);
  const cita =
    (s.quote ?? s.excerpt ?? s.description ?? '').trim() || '—';
  const v = (s.videoUrl ?? '').trim();
  return {
    id: s.id,
    nombre: name,
    titulo: s.title ?? s.label ?? 'Historia',
    cita,
    fecha: formatPublishedAtEsStable(s.publishedAt),
    lugar: lugar || '—',
    foto_perfil: foto,
    imagen_principal: imagen,
    tags: tagsFromStory(s),
    videoUrl: v || undefined,
  };
}

/** Carrusel audios: portada + enlace de audio, sin video. */
export function storyPointToHistoricalExhibitionAudio(
  s: StoryPoint
): HistoricalExhibitionStory {
  const base = storyPointToHistoricalExhibitionStory(s);
  const a = (s.audioUrl ?? '').trim();
  const tags = base.tags.filter((t) => t !== 'video');
  if (!tags.includes('audio')) tags.unshift('audio');
  return {
    ...base,
    videoUrl: undefined,
    audioUrl: a || undefined,
    tags,
  };
}

/** Texto o foto: tarjeta sin reproductor A/V en URL (se abre lector/álbum en modal). */
export function storyPointToHistoricalExhibitionReader(
  s: StoryPoint,
  kind: 'texto' | 'foto'
): HistoricalExhibitionStory {
  const base = storyPointToHistoricalExhibitionStory(s);
  const tag = kind === 'foto' ? 'foto' : 'texto';
  const tags = base.tags.filter((t) => t !== 'video');
  if (!tags.includes(tag)) tags.unshift(tag);
  return {
    ...base,
    videoUrl: undefined,
    tags,
  };
}
