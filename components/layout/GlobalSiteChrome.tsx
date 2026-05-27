'use client';

/**
 * Masthead y relleno superior compartidos: misma pieza que la home (`HomeFirstPartSiteHeader`)
 * en todas las rutas salvo `/` (header dentro de `HomeFirstPart`) y `/mapa/*` (subrutas legacy; `/mapa` redirige a `/#mapa`).
 */
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { HistoriasInteriorSiteHeader } from '@/components/historias/HistoriasInteriorSiteHeader';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
import { historiasInterior } from '@/lib/historias-neumorph';

function showGlobalSiteChrome(pathname: string): boolean {
  if (pathname === '/') return false;
  if (pathname === '/mapa' || pathname.startsWith('/mapa/')) return false;
  return true;
}

const ROUTES_WITHOUT_BREADCRUMBS = new Set(['/terminos', '/privacidad', '/vision']);

/**
 * Audio / vídeo / texto / foto en rutas dedicadas se renderizan en modo `embed` bajo este chrome
 * (sin portal `fixed` a pantalla completa). El header usa el mismo patrón que el resto de interiores:
 * menú «Historias» desplegable, z-index normal, coherencia con el footer global.
 */
export function GlobalSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  if (!showGlobalSiteChrome(pathname)) {
    return <>{children}</>;
  }
  const showBreadcrumbsSlot = !ROUTES_WITHOUT_BREADCRUMBS.has(pathname);

  return (
    <>
      <HistoriasInteriorSiteHeader overImmersiveMedia={false} />
      <div
        className={`flex w-full min-h-0 flex-1 flex-col ${historiasInterior.fixedHeaderContentPadClassName}`}
      >
        {showBreadcrumbsSlot ? (
          <div className="w-full shrink-0 px-4 pb-2 md:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">
              <SiteBreadcrumbs />
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </>
  );
}
