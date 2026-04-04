'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { GLASS_CAROUSEL_COUNT } from '@/lib/muestras-glass-carousel';

const MUESTRA_PANEL_SEL = '[data-muestra-panel]';

function wheelDeltaYPixels(e: WheelEvent): number {
  switch (e.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return e.deltaY * 16;
    case WheelEvent.DOM_DELTA_PAGE:
      return e.deltaY * Math.max(240, window.innerHeight * 0.85);
    default:
      return e.deltaY;
  }
}

export type CinematicDeckController = {
  containerRef: RefObject<HTMLDivElement | null>;
  progressRef: MutableRefObject<number>;
  webglOn: boolean;
  reduceMotion: boolean;
  uiIndex: number;
  goToIndex: (i: number) => void;
};

export function useCinematicDeck(): CinematicDeckController {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [uiIndex, setUiIndex] = useState(0);
  const [webglOn, setWebglOn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const maxIdx = GLASS_CAROUSEL_COUNT - 1;

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    setWebglOn(!mq.matches);
    const onChange = () => {
      setReduceMotion(mq.matches);
      setWebglOn(!mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useLayoutEffect(() => {
    progressRef.current = maxIdx > 0 ? uiIndex / maxIdx : 0;
  }, [uiIndex, maxIdx]);

  const syncIndexFromScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const i = Math.round(el.scrollLeft / w);
    const clamped = Math.max(0, Math.min(maxIdx, i));
    setUiIndex(clamped);
  }, [maxIdx]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => syncIndexFromScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    syncIndexFromScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [syncIndexFromScroll]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const i = Math.round(el.scrollLeft / w);
      el.scrollLeft = Math.max(0, Math.min(maxIdx, i)) * w;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxIdx]);

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const onWheel = (e: WheelEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 4) return;

      const under =
        typeof document !== 'undefined' && Number.isFinite(e.clientX)
          ? document.elementFromPoint(e.clientX, e.clientY)
          : null;
      const el = containerRef.current;
      if (!el || !(under instanceof Element) || !el.contains(under)) {
        return;
      }

      const panel = under.closest(MUESTRA_PANEL_SEL);
      if (panel instanceof HTMLElement && el.contains(panel)) {
        const sh = panel.scrollHeight;
        const ch = panel.clientHeight;
        if (sh > ch + 2) {
          const st = panel.scrollTop;
          const maxScroll = Math.max(0, sh - ch);
          const atTop = st <= 2;
          const atBottom = st >= maxScroll - 2;
          const dyp = wheelDeltaYPixels(e);
          if (dyp > 0 && !atBottom) {
            e.preventDefault();
            panel.scrollTop = Math.min(maxScroll, st + dyp);
            return;
          }
          if (dyp < 0 && !atTop) {
            e.preventDefault();
            panel.scrollTop = Math.max(0, st + dyp);
            return;
          }
        }
      }

      const dy = e.deltaY;
      const dx = e.deltaX;
      if (Math.abs(dy) >= Math.abs(dx) && dy !== 0) {
        e.preventDefault();
        el.scrollLeft += dy;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && dx !== 0) {
        e.preventDefault();
        el.scrollLeft += dx;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { capture: true });
  }, [reduceMotion]);

  const goToIndex = useCallback(
    (i: number) => {
      if (i < 0 || i >= GLASS_CAROUSEL_COUNT) return;
      const el = containerRef.current;
      if (!el) {
        setUiIndex(i);
        return;
      }
      const w = el.clientWidth;
      el.scrollTo({
        left: i * w,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
      setUiIndex(i);
    },
    [reduceMotion]
  );

  return {
    containerRef,
    progressRef,
    webglOn,
    reduceMotion,
    uiIndex,
    goToIndex,
  };
}
