import type { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase/admin';
import { ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { mePreguntaAprobada } from '@/lib/me-pregunto/server';
import { cookies } from 'next/headers';
import { PreguntasClient } from '@/components/hilos/PreguntasClient';
import { hiloPorId, preguntaHiloPorId } from '@/lib/hilos';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { PUBLIC_OG_LOCALE } from '@/lib/i18n/public-meta';
import { esMePreguntaId, ME_PREGUNTO_ID } from '@/lib/me-pregunto/shared';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ p?: string | string[]; tema?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const pedido = firstParam((await searchParams).p);
  const jar = await cookies();
  const locale = parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  const copy = HILOS_UI[locale];
  const persona = esMePreguntaId(pedido) ? await mePreguntaAprobada(getAdminDb(), pedido).catch(() => null) : null;
  const title = persona ? `${persona.texto} · AlmaMundi` : `${copy.ceja} · AlmaMundi`;
  const description = persona ? ME_PREGUNTO_UI[locale].bajada : copy.bajada;
  const image = {
    url: pedido ? `/og/pregunta?p=${encodeURIComponent(pedido)}` : '/og/sitio',
    width: 1200,
    height: 630,
    alt: copy.ceja,
  };
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: pedido ? `/preguntas?p=${encodeURIComponent(pedido)}` : '/preguntas',
      type: 'website',
      locale: PUBLIC_OG_LOCALE[locale],
      siteName: 'AlmaMundi',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function PreguntasPage({ searchParams }: Props) {
  const params = await searchParams;
  const pedido = firstParam(params.p);
  if (esMePreguntaId(pedido) || pedido === ME_PREGUNTO_ID || firstParam(params.tema) === ME_PREGUNTO_ID) {
    return <PreguntasClient initialId={esMePreguntaId(pedido) ? pedido : null} initialTema={ME_PREGUNTO_ID} />;
  }
  const porId = preguntaHiloPorId(pedido);
  const tema =
    porId?.hiloId ?? hiloPorId(pedido)?.id ?? hiloPorId(firstParam(params.tema))?.id ?? null;
  const pregunta = porId && !hiloPorId(pedido) ? porId.id : null;
  return <PreguntasClient initialId={pregunta} initialTema={tema} />;
}
