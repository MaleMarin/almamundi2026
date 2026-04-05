import type { ReactNode } from 'react';

/**
 * Sin animación aquí: Framer + hijos RSC de Next no garantizan exit/enter y el `absolute` rompía
 * el layout del hilo (canvas sin tamaño / opacidad). El fundido vive en `MuestrasSalaEntranceLink` (View Transitions).
 */
export default function MuestrasLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
