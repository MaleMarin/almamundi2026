import { requirePublicStory } from '@/lib/historias/require-public-story';
import ObservatorioHistoriaModalClient from './ObservatorioHistoriaModalClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ObservatorioHistoriaModalPage({ params }: PageProps) {
  const { id } = await params;
  const story = await requirePublicStory(id);
  return <ObservatorioHistoriaModalClient story={story} />;
}
