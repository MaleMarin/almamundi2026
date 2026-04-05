'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

type Props = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Enlace a `/muestras/[slug]`. Navegación directa (sin View Transitions ni capas .transition-hilo).
 */
export function MuestrasSalaEntranceLink({ href, className, style, children }: Props) {
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
