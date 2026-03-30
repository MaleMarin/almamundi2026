import React from 'react';

/** Evita prerender estático de `/mapa` y HTML cacheado en CDN como “sitio viejo”. */
export const dynamic = 'force-dynamic';

/**
 * Layout de /mapa: contenido + slot modal para intercepting route (observatorio).
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
      {children}
      {modal}
    </>
  );
}
