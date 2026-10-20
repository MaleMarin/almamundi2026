import { requirePublicStory } from '@/lib/historias/require-public-story';
import { StoryObservatoryPageClient } from './StoryObservatoryPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ObservatorioHistoriaPage({ params }: PageProps) {
  const { id } = await params;
  const story = await requirePublicStory(id);
  return <StoryObservatoryPageClient story={story} />;
}
