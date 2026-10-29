import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ShortLinkRedirect } from '@/components/short-link/ShortLinkRedirect';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';
import { preguntaTexto } from '@/lib/pregunta-semana';
import { getRespuestaByShortCode } from '@/lib/respuestas/by-code';
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

function answerPreviewDescription(
  locale: AlmaLocale,
  kind: 'texto' | 'voz' | 'foto',
  place: string
): string {
  const where = place.trim();
  if (locale === 'pt') {
    const what = kind === 'voz' ? 'com voz' : kind === 'foto' ? 'com uma foto' : 'escrita';
    return where
      ? `Uma resposta ${what} à pergunta da semana do AlmaMundi, de ${where}.`
      : `Uma resposta ${what} à pergunta da semana do AlmaMundi.`;
  }
  if (locale === 'en') {
    const what = kind === 'voz' ? 'voice' : kind === 'foto' ? 'photo' : 'written';
    return where
      ? `A ${what} answer to AlmaMundi's question of the week, from ${where}.`
      : `A ${what} answer to AlmaMundi's question of the week.`;
  }
  const what = kind === 'voz' ? 'con voz' : kind === 'foto' ? 'con una foto' : 'escrita';
  return where
    ? `Una respuesta ${what} a la pregunta de la semana de AlmaMundi, desde ${where}.`
    : `Una respuesta ${what} a la pregunta de la semana de AlmaMundi.`;
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
  const titulo = preguntaTexto(item.questionId, 'tu', locale)?.trim() || 'Respuesta';
  const place = formatPublicPlace(item.city, item.country);
  const description = answerPreviewDescription(locale, item.kind, place);
  const photo = item.kind === 'foto' ? publicImage(item.previewUrl) : '';
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
      kind="answer"
      globeHref={`/?respuesta=${encodeURIComponent(item.id)}#mapa`}
      lightHref={`/pregunta/${encodeURIComponent(item.questionId)}`}
    />
  );
}
