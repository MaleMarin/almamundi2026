import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PreguntasClient } from '@/components/hilos/PreguntasClient';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { PUBLIC_OG_LOCALE } from '@/lib/i18n/public-meta';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ p?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const locale = parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  const copy = HILOS_UI[locale];
  const title = `${copy.ceja} · AlmaMundi`;
  const image = {
    url: '/og-image.png',
    width: 1200,
    height: 630,
    alt: copy.ceja,
  };
  return {
    title: { absolute: title },
    description: copy.bajada,
    openGraph: {
      title,
      description: copy.bajada,
      url: '/preguntas',
      type: 'website',
      locale: PUBLIC_OG_LOCALE[locale],
      siteName: 'AlmaMundi',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: copy.bajada,
      images: [image.url],
    },
  };
}

export default async function PreguntasPage({ searchParams }: Props) {
  const params = await searchParams;
  return <PreguntasClient initialId={firstParam(params.p)} />;
}
