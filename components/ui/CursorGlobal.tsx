'use client';

import { useEffect, useRef, useState } from 'react';

export function CursorGlobal() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    const dotMaybe = dotRef.current;
    const ringMaybe = ringRef.current;
    if (!dotMaybe || !ringMaybe) return;
    const dotEl: HTMLDivElement = dotMaybe;
    const ringEl: HTMLDivElement = ringMaybe;

    const cx0 = window.innerWidth / 2;
    const cy0 = window.innerHeight / 2;
    let mx = cx0;
    let my = cy0;
    let cx = cx0;
    let cy = cy0;
    let rx = cx0;
    let ry = cy0;
    let animId: number;

    dotEl.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    ringEl.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    document.documentElement.setAttribute('data-cursor-global', 'on');

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function tick() {
      cx = lerp(cx, mx, 0.16);
      cy = lerp(cy, my, 0.16);
      rx = lerp(rx, mx, 0.07);
      ry = lerp(ry, my, 0.07);
      dotEl.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      ringEl.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      animId = requestAnimationFrame(tick);
    }
    tick();

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
    }

    function onEnterLink() {
      dotEl.classList.add('cursor-hover');
      ringEl.classList.add('cursor-hover');
    }

    function onLeaveLink() {
      dotEl.classList.remove('cursor-hover');
      ringEl.classList.remove('cursor-hover');
    }

    const hoverBound = new WeakSet<HTMLElement>();

    function attachHover() {
      document
        .querySelectorAll('a, button, [role="button"], [data-cursor-hover]')
        .forEach((el) => {
          if (!(el instanceof HTMLElement)) return;
          if (hoverBound.has(el)) return;
          hoverBound.add(el);
          el.addEventListener('mouseenter', onEnterLink);
          el.addEventListener('mouseleave', onLeaveLink);
        });
    }

    attachHover();
    const mutObs = new MutationObserver(attachHover);
    mutObs.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
      mutObs.disconnect();
      document.documentElement.removeAttribute('data-cursor-global');
      document
        .querySelectorAll('a, button, [role="button"], [data-cursor-hover]')
        .forEach((el) => {
          if (!(el instanceof HTMLElement)) return;
          el.removeEventListener('mouseenter', onEnterLink);
          el.removeEventListener('mouseleave', onLeaveLink);
        });
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
