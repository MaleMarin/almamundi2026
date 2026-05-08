import type { ReactNode } from 'react';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
import { MuestrasInteriorNav } from '@/components/muestras/MuestrasInteriorNav';
import { historiasInterior } from '@/lib/historias-neumorph';

/**
 * Salas curadas («el hilo»): nav + área flexible para que SalaHilo / WebGL tengan altura real (min-h-0).
 */
export default function MuestraSlugLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className={`${historiasInterior.mainClassName} w-full min-w-0`}>
      <MuestrasInteriorNav />
      <div className="w-full shrink-0 px-6 pt-4 md:px-12 md:pt-5">
        <div className="mx-auto max-w-5xl">
          <SiteBreadcrumbs />
        </div>
      </div>
      {/*
        Sin min-h-0 aquí: en flex column con altura “auto” min-h-0 puede dejar este bloque a 0px
        y el canvas del hilo no pinta (usuario ve solo el fondo).
      */}
      <div className="flex w-full min-w-0 flex-1 flex-col min-h-[calc(100dvh-6.5rem)]">
        {children}
      </div>
    </div>
  );
}
