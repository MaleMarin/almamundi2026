import React from 'react';

/**
 * Layout propio de /mapa: solo renderiza el contenido.
 * NO incluye header/nav global del sitio (el root layout tampoco los tiene).
 */
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
