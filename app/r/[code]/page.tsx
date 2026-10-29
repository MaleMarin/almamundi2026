import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ShortLinkRedirect } from '@/components/short-link/ShortLinkRedirect';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';
import { preguntaTexto } from '@/lib/pregunta-semana';
import { getRespuestaByShortCode } from '@/lib/respuestas/by-code';
import {
  publishedStoryPreviewDescription,
  type PublishedStoryFormat,
} from '@/lib/share/published-share';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';

type PageProps = { params: Promise<{ code: string }> };

const SITE_OG_IMAGE = '/og-image.png';
const OG_LOCALE: Record<AlmaLocale, string> = {
  es: 'es_CL',
  pt: 'pt_BR',
  en: 'en_US',
};

async function requestLocale(): Promise<AlmaLocale> {
  try {
    const jar = await cookies();
    return parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  } catch {
    return 'es';
  }
}

function publicImage(url: string | null | undefined): string {
  const value = (url ?? '').trim();
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return '';
}

function answerFormat(kind: 'texto' | 'voz' | 'foto'): PublishedStoryFormat {
  if (kind === 'voz') return 'audio';
  if (kind === 'foto') return 'photo';
  return 'text';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const item = await getRespuestaByShortCode(code);
  const metadataBase = new URL(PUBLIC_SITE_ORIGIN);
  if (!item) {
    return {
      metadataBase,
      title: { absolute: '404 · AlmaMundi' },
      robots: { index: false, follow: false },
    };
  }
  const locale = await requestLocale();
  const format = answerFormat(item.kind);
  const titulo = preguntaTexto(item.questionId, item.mode, locale)?.trim() || 'Respuesta';
  const description = publishedStoryPreviewDescription(
    locale,
    format,
    formatPublicPlace(item.city, item.country)
  );
  const photo = format === 'photo' ? publicImage(item.previewUrl) : '';
  const image = photo || SITE_OG_IMAGE;
  const canonical = `${PUBLIC_SITE_ORIGIN}/pregunta/${item.questionId}`;
  return {
    metadataBase,
    title: { absolute: `${titulo} · AlmaMundi` },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      title: `${titulo} · AlmaMundi`,
      description,
      url: `${PUBLIC_SITE_ORIGIN}/r/${code}`,
      images: [{ url: image, width: 1200, height: 630, alt: titulo }],
      type: 'article',
      locale: OG_LOCALE[locale],
      siteName: 'AlmaMundi',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} · AlmaMundi`,
      description,
      images: [image],
    },
  };
}

export default async function ShortAnswerPage({ params }: PageProps) {
  const { code } = await params;
  const item = await getRespuestaByShortCode(code);
  if (!item) notFound();
  const locale = await requestLocale();
  return (
    <ShortLinkRedirect
      locale={locale}
      globeHref={`/?respuesta=${encodeURIComponent(item.id)}#mapa`}
      lightHref={`/pregunta/${encodeURIComponent(item.questionId)}`}
    />
  );
}
