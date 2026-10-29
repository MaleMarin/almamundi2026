import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { requirePublicStory } from '@/lib/historias/require-public-story';
import { storyToVideoHistoria } from '@/lib/historias/video-adapter';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { StoryJsonLd } from '@/components/historia/StoryJsonLd';
import HistoriasIdVideoPageClient from './HistoriasIdVideoPageClient';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildHistoriaStoryMetadata(id);
}

export default async function HistoriasIdVideoPage({ params }: PageProps) {
  const { id } = await params;
  const story = await requirePublicStory(id);
  if (!story.videoUrl) redirect(`/historias/${id}`);
  const locale = parseAlmaLocale((await cookies()).get(ALMA_LOCALE_COOKIE)?.value);
  return (
    <>
      <StoryJsonLd id={id} />
      <HistoriasIdVideoPageClient historia={storyToVideoHistoria(story, locale)} />
    </>
  );
}
