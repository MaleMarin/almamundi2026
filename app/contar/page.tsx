import type { Metadata } from 'next';
import { HomePageClient } from '@/components/home/HomePageClient';
import { contarMetadata } from '@/lib/contar-routes';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ c?: string | string[] }> };

const COLORES = {
  es: { title: 'AlmaMundi · Historias que no se pierden en el scroll', description: 'Cuenta la tuya en video, audio, texto o foto.' },
  pt: { title: 'AlmaMundi · Histórias que não se perdem no scroll', description: 'Conte a sua em vídeo, áudio, texto ou foto.' },
  en: { title: 'AlmaMundi · Stories that don’t get lost in the scroll', description: 'Tell yours in video, audio, text or photo.' },
} as const;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const jar = await cookies();
  const raw = jar.get(ALMA_LOCALE_COOKIE)?.value;
  const base = contarMetadata('index', raw);
  const c = (await searchParams).c;
  const id = Array.isArray(c) ? c[0] : c;
  // Al compartir justo después de enviar una historia: la tarjeta muestra sus colores.
  if (!id || !/^[A-Za-z0-9]{8,40}$/.test(id)) return base;
  const copy = COLORES[parseAlmaLocale(raw)];
  const image = { url: `/og/colores?c=${id}`, width: 1200, height: 630, alt: copy.title };
  return {
    ...base,
    openGraph: { ...base.openGraph, title: copy.title, description: copy.description, images: [image] },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: [image.url] },
  };
}

export default function ContarPage() {
  return <HomePageClient />;
}
