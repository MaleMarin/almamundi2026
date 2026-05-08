'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Breadcrumbs, type BreadcrumbNavItem } from '@/components/layout/Breadcrumbs';
import {
  buildSiteBreadcrumbs,
  shouldShowSiteBreadcrumbs,
  siteBreadcrumbTone,
} from '@/lib/layout/site-breadcrumbs';

export type SiteBreadcrumbsProps = {
  /**
   * Fondo claro u oscuro. Si se omite, se elige según la ruta
   * (p. ej. `/archivo`, `/admin`, `/curaduria` → oscuro).
   */
  tone?: 'light' | 'dark';
  className?: string;
};

function SiteBreadcrumbsInner({ tone: toneProp, className = '' }: SiteBreadcrumbsProps) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const muestrasList =
    pathname === '/muestras' &&
    (searchParams.get('list') === '1' || searchParams.getAll('list').includes('1'));

  if (!shouldShowSiteBreadcrumbs(pathname, muestrasList)) {
    return null;
  }

  const items = buildSiteBreadcrumbs(pathname);
  if (items.length <= 1) {
    return null;
  }

  const navItems: BreadcrumbNavItem[] = items.map((item, index) => {
    if (index === items.length - 1) {
      return { label: item.label };
    }
    if (item.href == null) {
      return { label: item.label };
    }
    return { label: item.label, href: item.href };
  });

  const tone = toneProp ?? siteBreadcrumbTone(pathname);
  return <Breadcrumbs items={navItems} tone={tone} className={className} />;
}

/**
 * Migas de pan según la ruta actual. No se muestra en home, raíz `/mapa`,
 * recorrido cinematográfico por defecto de `/muestras` ni rutas `/cinematic`.
 */
export function SiteBreadcrumbs({ tone, className = '' }: SiteBreadcrumbsProps) {
  return (
    <Suspense fallback={null}>
      <SiteBreadcrumbsInner tone={tone} className={className} />
    </Suspense>
  );
}
