'use client';

/**
 * Migas en rutas `/mapa/...` (no aplica a `/mapa` raíz: allí `mapa/page.tsx` lleva su propia barra).
 * Posición alineada con el bloque de migas del mapa a pantalla completa (esquina sup. izq.).
 */
import { usePathname } from 'next/navigation';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';

export function MapaSubrouteBreadcrumbs() {
  const pathname = usePathname() ?? '';
  if (!pathname.startsWith('/mapa/')) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-2 top-2 z-[80] max-w-[min(100%-1rem,28rem)] sm:left-3 sm:top-3">
      <div className="pointer-events-auto">
        <SiteBreadcrumbs tone="dark" />
      </div>
    </div>
  );
}
