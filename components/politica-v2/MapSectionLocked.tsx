'use client';

import dynamic from 'next/dynamic';
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

  return (
    <>
      {/* Sección mapa: solo tras scroll (título fuera de la primera vista) */}
      <section
        id="mapa"
        className="relative z-[15] w-full scroll-mt-32 bg-[var(--home-bg)] -mt-32 pt-32 md:scroll-mt-40 md:-mt-40 md:pt-40 lg:scroll-mt-44 lg:-mt-44 lg:pt-44"
      >
        <div className="map-section-gradient-block w-full">
          <h2
            className="mapa-almamundi-title text-center text-[72px] md:text-[96px] lg:text-[110px] leading-none pt-12 pb-2 md:pt-14 md:pb-3"
            style={{ color: 'var(--almamundi-orange)' }}
          >
            {t.mapSectionTitle}
          </h2>
          <p
            className="home-intro-avenir relative z-[1] mx-auto max-w-[min(100%,42rem)] px-6 pb-6 text-center text-base font-light leading-[1.6] tracking-wide text-gray-600 md:pb-8 md:text-lg lg:text-xl"
          >
            {t.heroSubBefore}{' '}
            <span className="font-normal">{t.heroSubBold}</span>
          </p>
          {/* Franja de funciones: aquí debajo de la frase (portal desde HomeMap). NO está en el universo. 100% neumorfismo. */}
          <div id="map-dock-slot" className="w-full px-2 md:px-3 py-4 md:py-5" />
          {/* Espacio fijo entre la barra y el globo: las palabras no tapan el mapa; el globo empieza debajo */}
          <div className="min-h-[64px] md:min-h-[88px] lg:min-h-[96px] w-full shrink-0" aria-hidden />
        </div>
        {/* Universo: globo debajo de la barra. Altura acotada (antes 120vh dejaba mucho negro vacío bajo la fecha). */}
        <div className="relative flex w-full min-h-[88vh] flex-col overflow-visible bg-[var(--universe-bg)] pt-2 md:pt-3">
          <HomeMap />
        </div>
      </section>
    </>
  );
}
