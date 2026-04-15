'use client';

import dynamic from 'next/dynamic';

/**
 * Sección mapa — LOCKED. No cambiar estructura, id, dock-slot ni HomeMap.
 * Regla: mapa-seccion-lock.mdc + no tocar la función real del mapa.
 */
const HomeMap = dynamic(
  () => import('@/components/map/HomeMap').then((m) => m.default),
  { ssr: false }
);

export function MapSectionLocked() {
  return (
    <>
      {/* Sección mapa: solo tras scroll (título fuera de la primera vista) */}
      <section id="mapa" className="w-full scroll-mt-20 bg-[var(--home-bg)]">
        <div className="map-section-gradient-block w-full">
          <h2
            className="mapa-almamundi-title text-center text-[72px] md:text-[96px] lg:text-[110px] leading-none py-12 md:py-14"
            style={{ color: 'var(--almamundi-orange)' }}
          >
            Mapa de AlmaMundi
          </h2>
          {/* Franja de funciones: aquí debajo de la frase (portal desde HomeMap). NO está en el universo. 100% neumorfismo. */}
          <div id="map-dock-slot" className="w-full px-2 md:px-3 py-4 md:py-5" />
          {/* Espacio fijo entre la barra y el globo: las palabras no tapan el mapa; el globo empieza debajo */}
          <div className="min-h-[48px] md:min-h-[64px] w-full shrink-0" aria-hidden />
        </div>
        {/* Universo: globo debajo de la barra. Altura acotada (antes 120vh dejaba mucho negro vacío bajo la fecha). */}
        <div className="relative flex w-full min-h-[88vh] flex-col overflow-hidden bg-[var(--universe-bg)]">
          <HomeMap />
        </div>
      </section>
    </>
  );
}
