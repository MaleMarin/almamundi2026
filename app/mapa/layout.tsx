import React from 'react';
import { MapaSubrouteBreadcrumbs } from '@/components/layout/MapaSubrouteBreadcrumbs';

/** Evita prerender estático de `/mapa` y HTML cacheado en CDN como “sitio viejo”. */
export const dynamic = 'force-dynamic';

/**
 * Layout de /mapa: contenido + slot modal para intercepting route (observatorio).
 * Migas unificadas en subrutas `/mapa/...` (la raíz `/mapa` define las suyas en `mapa/page.tsx`).
 */
export default function MapaLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      <MapaSubrouteBreadcrumbs />
      {children}
      {modal}
    </>
  );
}
