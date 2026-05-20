'use client';

import { useLayoutEffect } from 'react';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

function redirectToHomeMap() {
  const p = window.location.pathname.replace(/\/$/, '') || '/';
  if (p !== '/mapa') return;
  window.location.replace(`${window.location.origin}${MAPA_HOME_REDIRECT_PATH}`);
}

/**
 * Respaldo cliente: `/mapa` → globo en la home (`/#mapa`).
 */
export function MapaToHomeRedirect() {
  useLayoutEffect(() => {
    redirectToHomeMap();
  }, []);

  return null;
}
