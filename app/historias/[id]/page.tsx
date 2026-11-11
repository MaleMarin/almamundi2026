import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requirePublicStory } from '@/lib/historias/require-public-story';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { StoryJsonLd } from '@/components/historia/StoryJsonLd';
import HistoriasIdPageClient from './HistoriasIdPageClient';
import { isTextStory } from '@/lib/historias/story-canonical';

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
