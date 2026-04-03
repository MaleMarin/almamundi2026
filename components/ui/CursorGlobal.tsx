'use client';

import { useEffect, useRef } from 'react';

export function CursorGlobal() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100;
    let my = -100;
    let cx = -100;
    let cy = -100;
    let rx = -100;
    let ry = -100;
    let animId: number;

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function tick() {
      cx = lerp(cx, mx, 0.16);
      cy = lerp(cy, my, 0.16);
      rx = lerp(rx, mx, 0.07);
      ry = lerp(ry, my, 0.07);
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      animId = requestAnimationFrame(tick);
    }
    tick();

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
    }

    function onEnterLink() {
      dot.classList.add('cursor-hover');
      ring.classList.add('cursor-hover');
    }

    function onLeaveLink() {
      dot.classList.remove('cursor-hover');
      ring.classList.remove('cursor-hover');
    }

    function attachHover() {
      document
        .querySelectorAll('a, button, [role="button"], [data-cursor-hover]')
        .forEach((el) => {
          if (!(el instanceof HTMLElement)) return;
          if (el.dataset.cursorBound === '1') return;
          el.dataset.cursorBound = '1';
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
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
