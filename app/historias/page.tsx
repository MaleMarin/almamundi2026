import { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { getPublicCatalogAsync } from '@/lib/map-data/stories-server';
import HistoriasCatalog from '@/components/historias/HistoriasCatalog';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';

const TITULO = { es: 'Historias contadas · AlmaMundi', pt: 'Histórias contadas · AlmaMundi', en: 'Stories told · AlmaMundi' } as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseAlmaLocale((await cookies()).get(ALMA_LOCALE_COOKIE)?.value);
  return { title: { absolute: TITULO[locale] } };
}

/** Misma lista pública que /api/historias, en caché 60 s como la API; así el HTML trae los enlaces a las historias. */
const catalogoPublico = unstable_cache(() => getPublicCatalogAsync(), ['catalogo-publico'], { revalidate: 60 });

export default async function HistoriasPage() {
  const iniciales = await catalogoPublico().catch(() => []);
  return (
    <Suspense>
      <HistoriasCatalog initialStories={iniciales} />
    </Suspense>
  );
}
