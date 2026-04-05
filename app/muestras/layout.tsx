import type { ReactNode } from 'react';

/** Layout mínimo; la entrada cinemática es mundo neumórfico autónomo (sin transición global al hilo). */
export default function MuestrasLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
