'use client';

import { useLayoutEffect } from 'react';
import { navigateToHomeMapa } from '@/lib/mapa-home-nav';

/**
 * `/mapa` no debe montar MapFullPage: redirige al mapa embebido en la home (`/#mapa`).
 */
export function MapaToHomeRedirect() {
  useLayoutEffect(() => {
    navigateToHomeMapa();
  }, []);

  return null;
}
