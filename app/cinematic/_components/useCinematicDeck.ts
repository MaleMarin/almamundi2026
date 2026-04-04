'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { CINEMATIC_PANELS } from './panels.data';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const GLASS_SCROLL_SEL = '[data-cinematic-glass-scroll]';

function findCinematicGlassScrollEl(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest(GLASS_SCROLL_SEL);
  return el instanceof HTMLElement ? el : null;
}

function glassScrollHasOverflow(glass: HTMLElement): boolean {
  return glass.scrollHeight > glass.clientHeight + 2;
}

/** deltaY en píxeles aproximados (trackpad suele venir en modo pixel). */
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
  const indexRef = useRef(0);
  const animatingRef = useRef(false);
  const progressRef = useRef(0);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const transitionToRef = useRef<(target: number) => void>(() => {});
  const [uiIndex, setUiIndex] = useState(0);
  const [webglOn, setWebglOn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const panelCount = CINEMATIC_PANELS.length;

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
    const maxIdx = panelCount - 1;
    progressRef.current = maxIdx > 0 ? indexRef.current / maxIdx : 0;
  }, [uiIndex, panelCount]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || panelCount === 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll('[data-cinematic-panel]')
    );
    sectionsRef.current = sections;
    const maxIdx = sections.length - 1;
    if (maxIdx < 0) return;

    const transitionTo = (target: number) => {
      if (animatingRef.current) return;
      if (target < 0 || target > maxIdx) return;
      const cur = indexRef.current;
      if (target === cur) return;
      const direction: 1 | -1 = target > cur ? 1 : -1;
      animatingRef.current = true;
      const currentEl = sections[cur];
      const nextEl = sections[target];
      if (!currentEl || !nextEl) {
        animatingRef.current = false;
        return;
      }
      const tl = gsap.timeline({
        defaults: { duration: 1.05, ease: 'power4.inOut' },
        onComplete: () => {
          animatingRef.current = false;
          indexRef.current = target;
          setUiIndex(target);
          progressRef.current = maxIdx > 0 ? target / maxIdx : 0;
          sections.forEach((el, j) => {
            gsap.set(el, { zIndex: j === target ? 2 : 0 });
          });
        },
      });
      /* autoAlpha = opacity + visibility:hidden para que no se superpongan lecturas */
      tl.to(
        currentEl,
        { autoAlpha: 0, yPercent: -100 * direction, scale: 0.9 },
        0
      ).fromTo(
        nextEl,
        { autoAlpha: 0, yPercent: 100 * direction, scale: 1.05, zIndex: 2 },
        { autoAlpha: 1, yPercent: 0, scale: 1, zIndex: 2 },
        0
      );
      const inner = nextEl.querySelectorAll('[data-cinematic-animate]');
      if (inner.length) {
        tl.from(
          inner,
          {
            y: 36,
            autoAlpha: 0,
            stagger: 0.12,
            duration: 0.75,
            ease: 'power2.out',
          },
          '-=0.55'
        );
      }
    };
    transitionToRef.current = transitionTo;

    if (reduced) {
      sections.forEach((el, i) => {
        gsap.set(el, {
          autoAlpha: i === 0 ? 1 : 0,
          yPercent: 0,
          scale: 1,
          zIndex: i === 0 ? 2 : 0,
        });
      });
      indexRef.current = 0;
      setUiIndex(0);
      return;
    }

    gsap.killTweensOf(sections);
    sections.forEach((el) => {
      el.querySelectorAll('[data-cinematic-animate]').forEach((node) => {
        gsap.killTweensOf(node);
        gsap.set(node, { clearProps: 'opacity,visibility,transform' });
      });
      gsap.set(el, {
        autoAlpha: 0,
        yPercent: 100,
        scale: 1,
        zIndex: 0,
      });
    });
    gsap.set(sections[0], {
      autoAlpha: 1,
      yPercent: 0,
      scale: 1,
      zIndex: 2,
    });
    indexRef.current = 0;
    setUiIndex(0);

    const wheelThreshold = 16;
    const onWheel = (e: WheelEvent) => {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || 0;
      const atPageTop = scrollTop <= 4;

      if (!atPageTop) {
        return;
      }

      if (animatingRef.current) {
        e.preventDefault();
        return;
      }

      /* Hit real bajo el puntero: con listener en capture, confiar solo en e.target falla a veces. */
      const under =
        typeof document !== 'undefined' && Number.isFinite(e.clientX)
          ? document.elementFromPoint(e.clientX, e.clientY)
          : null;
      const glass = findCinematicGlassScrollEl(under ?? e.target);

      /*
       * Scroll dentro del círculo: el wheel global en capture impide el scroll nativo fiable;
       * aplicamos delta a scrollTop y evitamos doble desplazamiento.
       */
      if (glass && glassScrollHasOverflow(glass)) {
        const dy = wheelDeltaYPixels(e);
        const { scrollTop: st, scrollHeight, clientHeight } = glass;
        const maxScroll = Math.max(0, scrollHeight - clientHeight);
        const atTop = st <= 2;
        const atBottom = st >= maxScroll - 2;

        if (dy > 0 && !atBottom) {
          e.preventDefault();
          glass.scrollTop = Math.min(maxScroll, st + dy);
          return;
        }
        if (dy < 0 && !atTop) {
          e.preventDefault();
          glass.scrollTop = Math.max(0, st + dy);
          return;
        }
      }

      const cur = indexRef.current;

      if (e.deltaY > wheelThreshold) {
        if (cur >= maxIdx) {
          return;
        }
        e.preventDefault();
        transitionToRef.current(cur + 1);
        return;
      }

      if (e.deltaY < -wheelThreshold) {
        if (cur <= 0) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        transitionToRef.current(cur - 1);
      }
    };

    let touchStartY = 0;
    let touchGlassScroll: { el: HTMLElement; top: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      const g = findCinematicGlassScrollEl(e.target);
      if (g && glassScrollHasOverflow(g)) {
        touchGlassScroll = { el: g, top: g.scrollTop };
      } else {
        touchGlassScroll = null;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (animatingRef.current) return;
      if (touchGlassScroll) {
        const moved = Math.abs(touchGlassScroll.el.scrollTop - touchGlassScroll.top);
        touchGlassScroll = null;
        if (moved > 8) return;
      } else {
        touchGlassScroll = null;
      }
      const y = e.changedTouches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y;
      if (dy > 56) transitionToRef.current(indexRef.current + 1);
      else if (dy < -56) transitionToRef.current(indexRef.current - 1);
    };

    const wheelOpts = { passive: false, capture: true } as const;
    window.addEventListener('wheel', onWheel, wheelOpts);
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });

    return () => {
      window.removeEventListener('wheel', onWheel, wheelOpts);
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      const els = root.querySelectorAll<HTMLElement>('[data-cinematic-panel]');
      gsap.killTweensOf(els);
      els.forEach((el) => {
        el.querySelectorAll('[data-cinematic-animate]').forEach((node) => {
          gsap.killTweensOf(node);
        });
      });
    };
  }, [panelCount]);

  useLayoutEffect(() => {
    if (!reduceMotion) return;
    const sections = sectionsRef.current;
    if (!sections.length) return;
    sections.forEach((el, i) => {
      gsap.set(el, {
        autoAlpha: i === uiIndex ? 1 : 0,
        yPercent: 0,
        scale: 1,
        zIndex: i === uiIndex ? 2 : 0,
      });
    });
    indexRef.current = uiIndex;
    const maxIdx = panelCount - 1;
    progressRef.current = maxIdx > 0 ? uiIndex / maxIdx : 0;
  }, [reduceMotion, uiIndex, panelCount]);

  const goToIndex = (i: number) => {
    if (i < 0 || i >= panelCount) return;
    if (reduceMotion) {
      setUiIndex(i);
      return;
    }
    transitionToRef.current(i);
  };

  return {
    containerRef,
    progressRef,
    webglOn,
    reduceMotion,
    uiIndex,
    goToIndex,
  };
}
