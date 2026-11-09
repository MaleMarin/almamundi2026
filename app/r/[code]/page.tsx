import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ShortLinkRedirect } from '@/components/short-link/ShortLinkRedirect';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';
import { esMePreguntaId } from '@/lib/me-pregunto/shared';
import { getRespuestaByShortCode } from '@/lib/respuestas/by-code';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ code: string }> };

export const metadata: Metadata = {
  title: 'Una respuesta en AlmaMundi',
  robots: { index: false, follow: true },
};

async function requestLocale(): Promise<AlmaLocale> {
  try {
    const jar = await cookies();
    return parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
  } catch {
    return 'es';
  }
}

/** Enlace corto de una respuesta publicada: abre el globo en esa respuesta (o su pregunta, en celulares sin globo). */
export default async function RespuestaCortaPage({ params }: PageProps) {
  const { code } = await params;
  const respuesta = await getRespuestaByShortCode(code);
  if (!respuesta) notFound();
  const locale = await requestLocale();
  const q = `${encodeURIComponent(respuesta.questionId)}&r=${encodeURIComponent(respuesta.id)}`;
  return (
    <ShortLinkRedirect
      locale={locale}
      globeHref={`/?respuesta=${encodeURIComponent(respuesta.id)}#mapa`}
      lightHref={esMePreguntaId(respuesta.questionId) ? `/preguntas-de-las-personas?p=${q}` : `/respuestas-a-almamundi?p=${q}`}
    />
  );
}
