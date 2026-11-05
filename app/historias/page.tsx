import { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import HistoriasCatalog from '@/components/historias/HistoriasCatalog';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';

const TITULO = { es: 'Historias contadas · AlmaMundi', pt: 'Histórias contadas · AlmaMundi', en: 'Stories told · AlmaMundi' } as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseAlmaLocale((await cookies()).get(ALMA_LOCALE_COOKIE)?.value);
  return { title: { absolute: TITULO[locale] } };
}

export default function HistoriasPage() {
  return (
    <Suspense>
      <HistoriasCatalog />
    </Suspense>
  );
}
