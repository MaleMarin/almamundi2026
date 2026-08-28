'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type StoryScrollBlockProps = {
  children: ReactNode;
  /** Reserva altura de viewport para que el siguiente bloque se revele al scrollear. */
  scene?: boolean;
};

/**
 * Bloque de una historia publicada: visible sin JS.
 * Con movimiento permitido, ScrollTrigger suma un fade + un desplazamiento corto.
 */
export function StoryScrollBlock({ children, scene = false }: StoryScrollBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.75,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        ...(scene
          ? {
              minHeight: 'min(78dvh, 44rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }
          : null),
      }}
    >
      {children}
    </div>
  );
}
