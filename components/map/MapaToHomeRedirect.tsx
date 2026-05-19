'use client';

import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/**
 * Respaldo si `/mapa` hidrata HTML en caché: redirect antes de React (inline) + en mount.
 */
export function MapaToHomeRedirect() {
  if (typeof window !== 'undefined' && window.location.pathname === '/mapa') {
    window.location.replace(`${window.location.origin}${MAPA_HOME_REDIRECT_PATH}`);
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `if(location.pathname==='/mapa'){location.replace(${JSON.stringify(MAPA_HOME_REDIRECT_PATH)});}`,
      }}
    />
  );
}
