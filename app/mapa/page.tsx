'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapFullPage = dynamic(
  () => import('@/components/map/MapFullPage').then((m) => m.default),
  { ssr: false }
);

/**
 * /mapa: globo 3D (react-globe) con norte arriba, BITS_DATA y panel Bits.
 * MapFullPage incluye dock, drawer, controles y el globo con los 100 Bits.
 */
export default function MapaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--home-bg)]">
      <div className="map-section-gradient-block w-full flex-shrink-0">
        <div className="pt-8 pb-2 flex items-center justify-center gap-4">
          <Link href="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            ← Volver al inicio
          </Link>
        </div>
        <h1 className="text-center text-5xl md:text-7xl leading-none py-6" style={{ color: 'var(--almamundi-orange)' }}>
          Mapa de AlmaMundi
        </h1>
        <div id="map-dock-slot" className="w-full px-2 md:px-3 py-4 md:py-5" />
        <div className="min-h-[32px] w-full shrink-0" aria-hidden />
      </div>
      <div
        className="relative w-full flex-1 min-h-[60vh] h-full min-h-screen bg-[var(--universe-bg)] flex flex-col overflow-hidden"
        style={{ minHeight: 'calc(100vh - 280px)', isolation: 'isolate' }}
      >
        <MapFullPage />
      </div>
    </div>
  );
}
