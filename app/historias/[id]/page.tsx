import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requirePublicStory } from '@/lib/historias/require-public-story';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { StoryJsonLd } from '@/components/historia/StoryJsonLd';
import HistoriasIdPageClient from './HistoriasIdPageClient';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildHistoriaStoryMetadata(id);
}

export default async function HistoriasIdPage({ params }: PageProps) {
  const { id } = await params;
  const story = await requirePublicStory(id);
  // Las historias de texto se abren directo en modo lectura (docs/decisiones-cerradas.md).
  if (isTextStory(story)) redirect(`/historias/${encodeURIComponent(id)}/texto`);
  return (
    <>
      <StoryJsonLd id={id} />
      <HistoriasIdPageClient story={story} />
    </>
  );
}

/** Misma regla que storyKind() en HistoriasIdPageClient: solo texto si no hay video, audio ni fotos. */
function isTextStory(story: Awaited<ReturnType<typeof requirePublicStory>>): boolean {
  // Sin texto, /texto devuelve aquí: no redirigir para no entrar en un ciclo.
  const contenido = (story.body ?? (story as { content?: string }).content ?? '').trim();
  if (!contenido) return false;
  const format = (story.format ?? '').toLowerCase();
  if (format === 'text' || format === 'texto') return true;
  if (format) return false;
  if (story.videoUrl || story.hasVideo || story.audioUrl || story.hasAudio) return false;
  if (story.imageUrl || (story.imagenes?.length ?? 0) > 0) return false;
  return true;
}
