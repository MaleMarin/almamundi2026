'use client';

import { useRouter } from 'next/navigation';
import { startTransition, type CSSProperties, type ReactNode, type MouseEvent } from 'react';

type DocWithVt = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => { finished: Promise<void> };
};

function runWithViewTransition(run: () => void) {
  if (typeof document === 'undefined') {
    run();
    return;
  }
  const d = document as DocWithVt;
  if (typeof d.startViewTransition === 'function') {
    d.startViewTransition(run);
  } else {
    run();
  }
}

type Props = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Entrada a `/muestras/[slug]` con fundido de página (View Transitions API cuando el navegador lo soporta).
 * Mantiene `<a href>` por accesibilidad y clic secundario.
 */
export function MuestrasSalaEntranceLink({ href, className, style, children }: Props) {
  const router = useRouter();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    runWithViewTransition(() => {
      startTransition(() => {
        router.push(href);
      });
    });
  };

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={() => router.prefetch(href)}
    >
      {children}
    </a>
  );
}
