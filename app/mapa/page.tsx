'use client';

import dynamic from 'next/dynamic';
import '@/app/mapa/mapa-ui.css';
import '@/app/mapa/liquid-metal.css';
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
      <MapFullPage embedded={false} universeVisible />
    </div>
  );
}
