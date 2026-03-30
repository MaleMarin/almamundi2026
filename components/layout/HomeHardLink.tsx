import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { isHomeHardNavHref } from '@/lib/home-hard-nav';

export type HomeHardLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children?: ReactNode;
};

/**
 * Enlace a la home real (`/`, `/#…`, `/?…`) con recarga completa del documento.
 * Sustituye a `next/link` en esos destinos para no quedar con caché vieja del App Router.
 */
export function HomeHardLink({ href, children, ...rest }: HomeHardLinkProps) {
  if (process.env.NODE_ENV === 'development' && !isHomeHardNavHref(href)) {
    console.error('[HomeHardLink] href inválido (solo `/`, `/#…`, `/?…`):', href);
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
