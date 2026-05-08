'use client';

import dynamic from 'next/dynamic';
import '@/app/mapa/mapa-ui.css';
import '@/app/mapa/liquid-metal.css';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { MAP_STAGE_GRADIENT } from '@/lib/map-data/stage-theme';

const MapFullPage = dynamic(
  () => import('@/components/map/MapFullPage').then((m) => m.default),
  { ssr: false }
);

/**
 * Ruta `/mapa`: `MapFullPage` a pantalla completa (mismo globo que `#mapa` en la home).
 * La Luna orbita vía `MapCanvas` + `lib/map-gl-moon.ts`.
 */
export default function MapaPage() {
  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden"
      style={{ background: MAP_STAGE_GRADIENT }}
      data-map-route="mapa-full"
    >
      <div className="pointer-events-none absolute left-2 top-2 z-[60] max-w-[min(100%-1rem,28rem)] sm:left-3 sm:top-3">
        <div className="pointer-events-auto">
          <Breadcrumbs tone="dark" items={[{ label: 'Inicio', href: '/' }, { label: 'Mapa' }]} />
        </div>
      </div>
      <MapFullPage embedded={false} universeVisible />
    </div>
  );
}
