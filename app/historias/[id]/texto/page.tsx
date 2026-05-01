/**
 * /historias/[id]/texto — Página de lectura (TextoReader).
 * Server component: carga la historia desde Firestore; si no tiene texto, redirige al detalle.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { demoStoryFieldsFromPoint } from '@/lib/demo-stories-public';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { TextoReaderClient } from './TextoReaderClient';
import type { StoryPoint } from '@/lib/map-data/stories';
import type { HistoriaTexto } from '@/components/historia/TextoReader';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function storyToHistoriaTexto(s: StoryPoint, contenido: string): HistoriaTexto {
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
  const wordCount = contenido.split(/\s+/).filter(Boolean).length;
  const tiempoLectura = Math.ceil(wordCount / 200);
  const demoStory = demoStoryFieldsFromPoint(s);
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Sin título',
    subtitulo: s.subtitle ?? s.description ?? ubicacion,
    contenido,
    tiempoLectura,
    fecha: s.publishedAt ?? '',
    autor: {
      nombre,
      avatar: s.author?.avatar ?? (s as StoryPoint & { authorAvatar?: string }).authorAvatar ?? defaultAvatar(nombre),
      ubicacion,
      bio: s.author?.bio,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
    ...(demoStory ? { demoStory } : {}),
  };
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildHistoriaStoryMetadata(id);
}

export default async function HistoriasIdTextoPage({ params }: PageProps) {
  const { id } = await params;
  const story = await getStoryByIdAsync(id);
  if (!story) redirect(`/historias/${id}`);
  const contenido = (story.body ?? (story as { content?: string }).content ?? '').trim();
  if (!contenido) redirect(`/historias/${id}`);
  const historia = storyToHistoriaTexto(story, contenido);
  return <TextoReaderClient historia={historia} />;
}
