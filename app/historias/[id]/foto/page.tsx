/**
 * /historias/[id]/foto — Álbum de fotos (FotoAlbum).
 * Server component: carga la historia desde Firestore; si no tiene imágenes, redirige al detalle.
 */
import { redirect } from 'next/navigation';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { FotoAlbumClient } from './FotoAlbumClient';
import type { StoryPoint } from '@/lib/map-data/stories';
import type { HistoriaFoto } from '@/components/historia/FotoAlbum';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function buildImagenes(s: StoryPoint): { url: string; caption?: string }[] {
  const sp = s as StoryPoint & {
    images?: string[];
    imagenes?: { url: string; caption?: string }[];
    photos?: { url: string; name?: string; date?: string }[];
  };
  if (sp.imagenes?.length) return sp.imagenes;
  if (sp.photos?.length) return sp.photos.map((p) => ({ url: p.url, caption: p.name ?? p.date }));
  if (sp.images?.length) return sp.images.map((url) => ({ url }));
  if (s.imageUrl) return [{ url: s.imageUrl }];
  return [];
}

function storyToHistoriaFoto(s: StoryPoint, imagenes: { url: string; caption?: string }[]): HistoriaFoto {
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
      avatar: s.author?.avatar ?? (s as StoryPoint & { authorAvatar?: string }).authorAvatar ?? defaultAvatar(nombre),
      ubicacion,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
  };
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const story = await getStoryByIdAsync(id);
  if (!story) return { title: 'Historia · AlmaMundi' };
  const imagenes = buildImagenes(story);
  const titulo = story.title ?? story.label ?? 'Historia';
  const autor = story.authorName ?? story.author?.name ?? '';
  return {
    title: `${titulo} · AlmaMundi`,
    description: imagenes.length > 0 ? `Álbum de ${imagenes.length} fotografías · ${autor}` : undefined,
  };
}

export default async function HistoriasIdFotoPage({ params }: PageProps) {
  const { id } = await params;
  const story = await getStoryByIdAsync(id);
  if (!story) redirect(`/historias/${id}`);
  const imagenes = buildImagenes(story);
  if (imagenes.length === 0) redirect(`/historias/${id}`);
  const historia = storyToHistoriaFoto(story, imagenes);
  return <FotoAlbumClient historia={historia} id={id} />;
}
