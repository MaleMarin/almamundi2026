import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ShortLinkRedirect } from '@/components/short-link/ShortLinkRedirect';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';
import { buildHistoriaStoryMetadata } from '@/lib/historias/story-page-metadata';
import { getStoryByShortCode } from '@/lib/map-data/stories-server';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';

type PageProps = { params: Promise<{ code: string }> };

async function requestLocale(): Promise<AlmaLocale> {
  try {
    const jar = await cookies();
    return parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  } catch {
    return 'es';
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const story = await getStoryByShortCode(code);
  if (!story) {
    return {
      title: { absolute: '404 · AlmaMundi' },
      robots: { index: false, follow: false },
    };
  }
  const base = await buildHistoriaStoryMetadata(story.id);
  const canonical = `${PUBLIC_SITE_ORIGIN}/historias/${story.id}`;
  return {
    ...base,
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      ...base.openGraph,
      url: `${PUBLIC_SITE_ORIGIN}/h/${code}`,
    },
  };
}

export default async function ShortStoryPage({ params }: PageProps) {
  const { code } = await params;
  const story = await getStoryByShortCode(code);
  if (!story) notFound();
  const locale = await requestLocale();
  return (
    <ShortLinkRedirect
      locale={locale}
      globeHref={`/?historia=${encodeURIComponent(story.id)}#mapa`}
      lightHref={`/historias/${encodeURIComponent(story.id)}`}
    />
  );
}
