'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  createContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import 'lenis/dist/lenis.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const LenisContext = createContext<Lenis | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

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
        autoRaf: false,
      });
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
            height: window.innerHeight,
          };
        },
      });
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
