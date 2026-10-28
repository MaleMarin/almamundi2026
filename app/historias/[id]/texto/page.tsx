/**
 * /historias/[id]/texto — Página de lectura (TextoReader).
 * Server component: historia inexistente → HTTP 404; sin texto → redirige al detalle.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requirePublicStory } from '@/lib/historias/require-public-story';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { StoryJsonLd } from '@/components/historia/StoryJsonLd';
import { TextoReaderClient } from './TextoReaderClient';
import type { StoryPoint } from '@/lib/map-data/stories';
import type { HistoriaTexto } from '@/components/historia/TextoReader';
import { storyUbicacionLabel } from '@/lib/historias/story-ubicacion';
import { questionPublicFields } from '@/lib/pregunta-semana';

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#B53514" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#D13D17" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function storyToHistoriaTexto(s: StoryPoint, contenido: string): HistoriaTexto {
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = storyUbicacionLabel(s);
  const wordCount = contenido.split(/\s+/).filter(Boolean).length;
  const tiempoLectura = Math.ceil(wordCount / 200);
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Sin título',
    subtitulo: s.subtitle ?? s.description,
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
    ...(s.cancionRelacionada ? { cancionRelacionada: s.cancionRelacionada } : {}),
    ...(s.antecedentes ? { antecedentes: s.antecedentes } : {}),
    ...questionPublicFields(s),
  };
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildHistoriaStoryMetadata(id);
}

export default async function HistoriasIdTextoPage({ params }: PageProps) {
  const { id } = await params;
  const story = await requirePublicStory(id);
  const contenido = (story.body ?? (story as { content?: string }).content ?? '').trim();
  if (!contenido) redirect(`/historias/${id}`);
  const historia = storyToHistoriaTexto(story, contenido);
  return (
    <>
      <StoryJsonLd id={id} />
      <TextoReaderClient historia={historia} />
    </>
  );
}
