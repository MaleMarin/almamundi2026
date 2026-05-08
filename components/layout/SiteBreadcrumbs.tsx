'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Breadcrumbs, type BreadcrumbNavItem } from '@/components/layout/Breadcrumbs';
import {
  buildSiteBreadcrumbs,
  shouldShowSiteBreadcrumbs,
} from '@/lib/layout/site-breadcrumbs';

export type SiteBreadcrumbsProps = {
  /** Fondo claro neumórfico (interiores) u oscuro (archivo / observatorio / admin). */
  tone?: 'light' | 'dark';
  className?: string;
};

function SiteBreadcrumbsInner({ tone = 'light', className = '' }: SiteBreadcrumbsProps) {
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

  return <Breadcrumbs items={navItems} tone={tone} className={className} />;
}

/**
 * Migas de pan según la ruta actual. No se muestra en home, `/mapa` a pantalla completa, lectores inmersivos ni recorrido cinematográfico por defecto de `/muestras`.
 */
export function SiteBreadcrumbs({ tone = 'light', className = '' }: SiteBreadcrumbsProps) {
  return (
    <Suspense fallback={null}>
      <SiteBreadcrumbsInner tone={tone} className={className} />
    </Suspense>
  );
}
