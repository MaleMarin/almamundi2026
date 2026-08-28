import type { Metadata } from 'next';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildHistoriaStoryMetadata(id);
}

export default function HistoriasIdLayout({ children }: Props) {
  return children;
}
