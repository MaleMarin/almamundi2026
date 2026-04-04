import type { ReactNode } from 'react';
import { MuestrasInteriorNav } from '@/components/muestras/MuestrasInteriorNav';

/**
 * Salas curadas (p. ej. «el hilo»): misma barra superior que el listado `/muestras`.
 * Altura reservada en el flujo para no colapsar el área bajo el `SalaHilo` fijo (footer raíz).
 */
export default function MuestraSlugLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <MuestrasInteriorNav />
      <div
        className="w-full shrink-0 min-h-[calc(100svh-5rem)] md:min-h-[calc(100svh-6rem)]"
        aria-hidden
      />
      {children}
    </>
  );
}
