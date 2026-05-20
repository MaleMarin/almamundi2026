'use client';

import { useEffect } from 'react';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/**
 * Si `/mapa` falla, no mostrar pantalla de error: ir al globo de la home.
 */
export default function MapaError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[mapa] redirecting to home map after error', error);
    window.location.replace(`${window.location.origin}${MAPA_HOME_REDIRECT_PATH}`);
  }, [error]);

  return null;
}
