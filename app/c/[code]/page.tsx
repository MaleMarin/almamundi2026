import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { IrAContar } from '@/app/c/[code]/IrAContar';
import { contarMetadata } from '@/lib/contar-routes';
import { getAdminDb } from '@/lib/firebase/admin';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { isShortCode } from '@/lib/short-code';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

const COPY = {
  es: { title: 'AlmaMundi · Historias que no se pierden en el scroll', description: 'Cuenta la tuya en video, audio, texto o foto.' },
  pt: { title: 'AlmaMundi · Histórias que não se perdem no scroll', description: 'Conte a sua em vídeo, áudio, texto ou foto.' },
  en: { title: 'AlmaMundi · Stories that don’t get lost in the scroll', description: 'Tell yours in video, audio, text or photo.' },
} as const;

/** Enlace corto de una historia recién enviada: busca su envío por el código. */
async function envioPorCodigo(code: string): Promise<string | null> {
  if (!isShortCode(code)) return null;
  const snap = await getAdminDb().collection('submissions').where('pendingShareCode', '==', code).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const raw = (await cookies()).get(ALMA_LOCALE_COOKIE)?.value;
  const base = contarMetadata('index', raw);
  const id = await envioPorCodigo(code).catch(() => null);
  if (!id) return base;
  const copy = COPY[parseAlmaLocale(raw)];
  const image = { url: `/og/colores?c=${id}`, width: 1200, height: 630, alt: copy.title };
  return {
    ...base,
    openGraph: { ...base.openGraph, title: copy.title, description: copy.description, images: [image] },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: [image.url] },
  };
}

/** Las redes leen la tarjeta de colores; las personas pasan directo a contar su historia. */
export default async function CodigoCompartir({ params }: Props) {
  const { code } = await params;
  if (!isShortCode(code)) notFound();
  return <IrAContar />;
}
