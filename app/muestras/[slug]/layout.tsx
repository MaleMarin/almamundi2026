import type { ReactNode } from 'react';
import { MuestrasInteriorNav } from '@/components/muestras/MuestrasInteriorNav';

/**
 * Salas curadas («el hilo»): nav + children en flujo normal (evita colapso flex del árbol raíz).
 */
export default function MuestraSlugLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <MuestrasInteriorNav />
      {children}
    </>
  );
}
