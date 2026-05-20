'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
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
        className="relative z-[15] w-full scroll-mt-32 bg-transparent -mt-32 pt-32 md:scroll-mt-40 md:-mt-40 md:pt-40 lg:scroll-mt-44 lg:-mt-44 lg:pt-44"
      >
        {/* Un solo degradado continuo (claro → noche → espacio); sin franja intermedia. */}
        <div className="map-section-atmosphere w-full">
          <div className="map-section-editorial relative z-[1] w-full">
            <h2
              className="mapa-almamundi-title map-section-hero-title text-center pt-10 pb-2 md:pt-12 md:pb-3"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              {t.mapSectionTitle}
            </h2>
            <p
              className="home-intro-avenir mx-auto max-w-[min(100%,42rem)] px-6 pb-5 text-center text-base font-light leading-[1.6] tracking-wide text-gray-600 md:pb-7 md:text-lg lg:max-w-2xl lg:text-xl"
            >
              {t.heroSubBefore}{' '}
              <span className="font-normal">{t.heroSubBold}</span>
            </p>
            {/* Franja de funciones: aquí debajo de la frase (portal desde HomeMap). NO está en el universo. */}
            <div id="map-dock-slot" className="w-full px-2 md:px-3" />
          </div>
          <div
            ref={globeUniverseRef}
            className="map-universe-stage relative z-[1] flex w-full min-h-[88vh] flex-col overflow-hidden pt-0"
          >
            <HomeMap universeSectionRef={globeUniverseRef} />
          </div>
        </div>
      </section>
    </>
  );
}
