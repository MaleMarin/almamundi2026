import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Recorrido demo: no indexar /muestras ni /muestras/[slug]. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout mínimo; la entrada cinemática es mundo neumórfico autónomo (sin transición global al hilo). */
export default function MuestrasLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
