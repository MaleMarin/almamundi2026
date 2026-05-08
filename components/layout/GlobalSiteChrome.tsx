'use client';

/**
 * Masthead y relleno superior compartidos: misma pieza que la home (`HomeFirstPartSiteHeader`)
 * en todas las rutas salvo `/` (header dentro de `HomeFirstPart`) y `/mapa` (experiencia a pantalla completa).
 */
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { HistoriasInteriorSiteHeader } from '@/components/historias/HistoriasInteriorSiteHeader';
import { historiasInterior } from '@/lib/historias-neumorph';

function showGlobalSiteChrome(pathname: string): boolean {
  if (pathname === '/') return false;
  if (pathname === '/mapa' || pathname.startsWith('/mapa/')) return false;
  return true;
}

/** Reproductores de historia a ruta dedicada: barra opaca y z-index sobre el lienzo oscuro. */
function immersiveHistoriasMediaRoute(pathname: string): boolean {
  return /^\/historias\/[^/]+\/(audio|video|foto|texto)$/.test(pathname);
}

export function GlobalSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  if (!showGlobalSiteChrome(pathname)) {
    return <>{children}</>;
  }
  const immersive = immersiveHistoriasMediaRoute(pathname);
  return (
    <>
      <HistoriasInteriorSiteHeader overImmersiveMedia={immersive} />
      <div
        className={`flex w-full min-h-0 flex-1 flex-col ${historiasInterior.fixedHeaderContentPadClassName}`}
      >
        {children}
      </div>
    </>
  );
}
