import type { Metadata } from 'next';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { StoryJsonLd } from '@/components/historia/StoryJsonLd';
import HistoriasIdAudioPageClient from './HistoriasIdAudioPageClient';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildHistoriaStoryMetadata(id);
}

export default async function HistoriasIdAudioPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <>
      <StoryJsonLd id={id} />
      <HistoriasIdAudioPageClient />
    </>
  );
}
