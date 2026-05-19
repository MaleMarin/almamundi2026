'use client';

import { useEffect } from 'react';

/**
 * `/mapa` ya no es una experiencia propia: el mapa vive en home `/#mapa` (MapSectionLocked + HomeMap).
 * `redirect('/#mapa')` en servidor pierde el fragmento; aquí forzamos la URL con hash en cliente.
 */
export function MapaToHomeRedirect() {
  useEffect(() => {
    const target = `${window.location.origin}/#mapa`;
    if (`${window.location.pathname}${window.location.hash}` !== `/#mapa`) {
      window.location.replace(target);
    }
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
