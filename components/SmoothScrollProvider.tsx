'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  createContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import 'lenis/dist/lenis.css';
import { installHomeReturnListener } from '@/lib/home-return';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const LenisContext = createContext<Lenis | null>(null);

/**
 * Al pasar a otra página con un enlace, la vista empieza arriba.
 * Sin esto, el desplazamiento suave conserva la altura de la página anterior
 * y la nueva puede abrirse a mitad de camino o en el pie.
 * No actúa con «atrás/adelante» del navegador ni cuando el destino trae ancla (#) o ?section=.
 */
function useInicioAlNavegar(lenis: Lenis | null) {
  const pathname = usePathname();
  const anterior = useRef<string | null>(null);
  const porHistorial = useRef(false);

  useEffect(() => {
    const marcar = () => {
      porHistorial.current = true;
    };
    window.addEventListener('popstate', marcar);
    return () => window.removeEventListener('popstate', marcar);
  }, []);

  useLayoutEffect(() => {
    const previo = anterior.current;
    anterior.current = pathname;
    if (previo === null || previo === pathname) return;
    if (porHistorial.current) {
      porHistorial.current = false;
      return;
    }
    if (window.location.hash || new URLSearchParams(window.location.search).has('section')) return;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname, lenis]);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    installHomeReturnListener();
  }, []);

  useInicioAlNavegar(lenis);

  useLayoutEffect(() => {
    let lenisInstance: Lenis | null = null;
    const scroller = document.documentElement;
    let tickerCb: ((time: number) => void) | null = null;

    try {
      lenisInstance = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        autoRaf: false });
      window.__almamundiLenis = lenisInstance as Window['__almamundiLenis'];
      ScrollTrigger.scrollerProxy(scroller, {
        scrollTop(value) {
          if (!lenisInstance) return 0;
          if (arguments.length && typeof value === 'number') {
            lenisInstance.scrollTo(value, { immediate: true });
          }
          return lenisInstance.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight };
        } });
      lenisInstance.on('scroll', ScrollTrigger.update);
      tickerCb = (time: number) => {
        lenisInstance?.raf(time * 1000);
      };
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);
      queueMicrotask(() => setLenis(lenisInstance));
    } catch (err) {
      console.error('[SmoothScrollProvider] Lenis / ScrollTrigger:', err);
      queueMicrotask(() => setLenis(null));
    }

    return () => {
      if (tickerCb) gsap.ticker.remove(tickerCb);
      try {
        ScrollTrigger.scrollerProxy(scroller, {});
      } catch {
        /* ignore */
      }
      try {
        lenisInstance?.destroy();
      } catch {
        /* ignore */
      }
      if (window.__almamundiLenis === lenisInstance) {
        delete window.__almamundiLenis;
      }
      queueMicrotask(() => setLenis(null));
      try {
        ScrollTrigger.refresh();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
