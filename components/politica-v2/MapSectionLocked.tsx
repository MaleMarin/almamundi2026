'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { CapituloHome } from '@/components/home/CapituloHome';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';

/**
 * Sección mapa — LOCKED. No cambiar estructura, id, dock-slot ni HomeMap.
 * Regla: mapa-seccion-lock.mdc + no tocar la función real del mapa.
 */
const HomeMap = dynamic(
  () => import('@/components/map/HomeMap').then((m) => m.default),
  { ssr: false }
);

export function MapSectionLocked() {
  const { t } = useHomeLocale();
  /** Contenedor del universo (globo + TimeBar): visibilidad para audio ambiente en `HomeMap` vía IntersectionObserver. */
  const globeUniverseRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Sección mapa: solo tras scroll (título fuera de la primera vista) */}
      <section
        id="mapa"
        className="home-capitulo-bloque relative z-[15] w-full scroll-mt-[9.75rem] bg-transparent md:scroll-mt-[var(--header-h)]"
      >
        <CapituloHome
          ceja={t.cejaDescubre}
          titulo={t.mapSectionTitle}
          portada
          bajada={t.heroSubBefore}
          bajadaFuerte={t.heroSubBold}
          bajadaEnDosLineas
        />
        <div className="home-noche" aria-hidden />
        <div className="map-section-atmosphere w-full">
          {/* Menú del mapa, opción D (Ana, 5 nov 2026): flota en el espacio negro, arriba del globo, sin tocarlo. */}
          <div id="map-dock-slot" className="map-dock-slot--noche relative z-[2] w-full px-2 md:px-3" />
          <div
            ref={globeUniverseRef}
            className="map-universe-stage relative z-[1] flex w-full min-h-[88vh] flex-col overflow-hidden pt-0"
          >
            <HomeMap universeSectionRef={globeUniverseRef} />
          </div>
          <div aria-hidden className="map-universe-fade-after" />
        </div>
      </section>
    </>
  );
}
