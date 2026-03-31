'use client';

import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { isHomeHardNavHref } from '@/lib/home-hard-nav';
import { ACTIVE_NAV_CLASS, isInternalNavActive } from '@/lib/internal-nav-active';

export type ActiveInternalNavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  style?: CSSProperties;
};

/**
 * Enlace de navegación que resalta en azul cuando coincide con la ruta o el hash actual (en `/`).
 */
export function ActiveInternalNavLink({
  href,
  className = '',
  activeClassName = ACTIVE_NAV_CLASS,
  style,
  children,
  ...rest
}: ActiveInternalNavLinkProps) {
  const pathname = usePathname() ?? '';
  const [hash, setHash] = useState('');
  useEffect(() => {
    const sync = () => setHash(typeof window !== 'undefined' ? window.location.hash : '');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const active = isInternalNavActive(href, pathname, hash);
  const merged = [className, active ? activeClassName : ''].filter(Boolean).join(' ').trim();

  if (isHomeHardNavHref(href)) {
    return (
      <HomeHardLink href={href} className={merged} style={style} {...rest}>
        {children}
      </HomeHardLink>
    );
  }

  return (
    <Link href={href} className={merged} style={style} {...rest}>
      {children}
    </Link>
  );
}
