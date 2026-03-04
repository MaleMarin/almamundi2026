import { notFound } from 'next/navigation';
import { getStoryForObservatory } from '@/lib/map-data/stories';
import { StoryObservatoryPageClient } from './StoryObservatoryPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ObservatorioHistoriaPage({ params }: PageProps) {
  const { id } = await params;
  const story = getStoryForObservatory(id);
  if (!story) notFound();
  return <StoryObservatoryPageClient story={story} />;
}
