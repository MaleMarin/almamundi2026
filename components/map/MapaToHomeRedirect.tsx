'use client';

import { useEffect } from 'react';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/**
 * Respaldo cliente si `/mapa` llegara a hidratar HTML en caché: el mapa vive en home `/#mapa`.
 * La ruta usa `redirect(MAPA_HOME_REDIRECT_PATH)` en servidor; este componente no debería montarse.
 */
export function MapaToHomeRedirect() {
  useEffect(() => {
    if (window.location.pathname !== '/mapa') return;
    window.location.replace(`${window.location.origin}${MAPA_HOME_REDIRECT_PATH}`);
  }, []);

  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-[#E0E5EC] px-6 text-center text-sm text-gray-600"
      aria-live="polite"
    >
      Redirigiendo al mapa de AlmaMundi…
    </div>
  );
}
