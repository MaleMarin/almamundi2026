import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import type { StoryPoint } from '@/lib/map-data/stories';
import {
  publishedStoryFormat,
  publishedStoryPreviewDescription,
  type PublishedStoryFormat,
} from '@/lib/share/published-share';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';

const SITE_OG_IMAGE = '/og-image.png';
function fallbackDescription(locale: AlmaLocale): string {
  if (locale === 'pt') return 'Uma história no AlmaMundi, o mapa de histórias humanas.';
  if (locale === 'en') return 'A story on AlmaMundi, the map of human stories.';
  return 'Una historia en AlmaMundi, el mapa de historias humanas.';
}

function fallbackTitle(locale: AlmaLocale): string {
  if (locale === 'pt') return 'História';
  if (locale === 'en') return 'Story';
  return 'Historia';
}
const OG_LOCALE: Record<AlmaLocale, string> = {
  es: 'es_CL',
  pt: 'pt_BR',
  en: 'en_US',
};

function publicImage(url: string | null | undefined): string {
  const value = (url ?? '').trim();
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return '';
}

function previewFormat(story: StoryPoint): PublishedStoryFormat {
  const named = (story.format ?? '').trim().toLowerCase();
  if (
    named === 'video' ||
    named === 'audio' ||
    named === 'image' ||
    named === 'foto' ||
    named === 'photos' ||
    named === 'text' ||
    named === 'texto' ||
    named === 'escrito'
  ) {
    return publishedStoryFormat(named);
  }
  if (story.videoUrl || story.hasVideo) return 'video';
  if (story.audioUrl || story.hasAudio) return 'audio';
  if ((story.imagenes?.length ?? 0) > 0) return 'photo';
  return 'text';
}

function ogImageForStory(
  story: StoryPoint,
  title: string,
  format: PublishedStoryFormat
): { url: string; width: number; height: number; alt: string } {
  const firstPhoto =
    publicImage(story.imagenes?.[0]?.url) || (format === 'photo' ? publicImage(story.imageUrl) : '');
  const videoFrame =
    format === 'video' ? publicImage(story.thumbnailUrl) || publicImage(story.imageUrl) : '';
  const profile = publicImage(story.authorAvatar) || publicImage(story.author?.avatar);
  const url = firstPhoto || videoFrame || profile || SITE_OG_IMAGE;
  return {
    url,
    width: 1200,
    height: 630,
    alt:
      url === SITE_OG_IMAGE
        ? 'AlmaMundi, historias de vida en video, audio, escrito y foto'
        : title,
  };
}

async function requestLocale(): Promise<AlmaLocale> {
  try {
    const jar = await cookies();
    return parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  } catch {
    return 'es';
  }
}

/**
 * Metadata OG/Twitter para `/historias/[id]`.
 * Título, formato y lugar públicos. La imagen es la primera foto, el cuadro del video o la foto de perfil.
 */
export async function buildHistoriaStoryMetadata(id: string): Promise<Metadata> {
  const story = await getStoryByIdAsync(id).catch(() => null);
  const metadataBase = new URL(PUBLIC_SITE_ORIGIN);
  const locale = await requestLocale();
  if (!story) {
    return {
      metadataBase,
      title: { absolute: '404 · AlmaMundi' },
      description: fallbackDescription(locale),
      robots: { index: false, follow: false },
    };
  }

  const missing = fallbackTitle(locale);
  const titulo = (story.title ?? story.label ?? missing).trim() || missing;
  const format = previewFormat(story);
  const description = publishedStoryPreviewDescription(
    locale,
    format,
    formatPublicPlace(story.city, story.country)
  );
  const image = ogImageForStory(story, titulo, format);

  return {
    metadataBase,
    title: { absolute: `${titulo} · AlmaMundi` },
    description,
    alternates: { canonical: './' },
    openGraph: {
      title: `${titulo} · AlmaMundi`,
      description,
      url: './',
      images: [image],
      type: 'article',
      locale: OG_LOCALE[locale],
      siteName: 'AlmaMundi',
      publishedTime: story.publishedAt ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} · AlmaMundi`,
      description,
      images: [image.url],
    },
  };
}
