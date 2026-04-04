import type { Metadata } from 'next';
import { CinematicPageClient } from '@/app/cinematic/_components/CinematicPageClient';
import { MuestrasListBody } from './MuestrasListBody';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Muestras',
  description:
    'Recorrido cinematográfico por las muestras demo (entrada en /muestras). Listado de piezas aprobadas: /muestras?list=1.',
};

function isListMode(sp: { list?: string | string[] }): boolean {
  const raw = sp.list;
  if (raw === '1') return true;
  if (Array.isArray(raw) && raw.includes('1')) return true;
  return false;
}

/**
 * Por defecto: recorrido cinematográfico (inicio de Muestras).
 * `?list=1`: listado neumórfico + API de piezas aprobadas.
 * Los enlaces antiguos con `?cinematic=1` siguen abriendo el recorrido (mismo resultado que sin query).
 */
export default async function MuestrasPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string | string[]; cinematic?: string | string[] }>;
}) {
  const sp = (await searchParams) ?? {};

  if (isListMode(sp)) {
    return <MuestrasListBody />;
  }

  return (
    <CinematicPageClient
      exitHref="/muestras?list=1"
      exitLabel="Listado de muestras"
    />
  );
}
