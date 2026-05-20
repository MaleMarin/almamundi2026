'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

function isMapaRootPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/mapa';
}

/**
 * En `/mapa` exacto no debe renderizarse layout de mapa legacy (migas, loading, MapFullPage).
 * Redirige al globo embebido en la home antes de pintar hijos.
 */
export function MapaLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  useLayoutEffect(() => {
    if (!isMapaRootPath(pathname)) return;
    window.location.replace(`${window.location.origin}${MAPA_HOME_REDIRECT_PATH}`);
  }, [pathname]);

  if (isMapaRootPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
