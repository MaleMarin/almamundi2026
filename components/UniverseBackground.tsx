'use client';

import { useEffect, useRef, useState } from 'react';

const UNIVERSE_Z_INDEX = -10;

function StarfieldCanvas({
  width,
  height,
  enabled,
}: {
  width: number;
  height: number;
  enabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; r: number; a: number; v: number }>>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      const nx = window.innerWidth > 0 ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
      const ny = window.innerHeight > 0 ? (e.clientY / window.innerHeight) * 2 - 1 : 0;
      mouseRef.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(800, Math.min(1200, Math.floor((w * h) / 1300)));
    const stars: Array<{ x: number; y: number; r: number; a: number; v: number }> = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.5 + Math.random() * 1.1,
        a: 0.4 + Math.random() * 0.4,
        v: 0.0006 + Math.random() * 0.004,
      });
    }
    starsRef.current = stars;

    const loop = (ts: number) => {
      const last = lastFrameRef.current || ts;
      const dt = Math.min(80, ts - last);
      lastFrameRef.current = ts;
      if (dt < 33) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const { x: mx, y: my } = mouseRef.current;
      const ox = mx * 10;
      const oy = my * 6;
      ctx.clearRect(0, 0, w, h);
      for (const s of starsRef.current) {
        s.x -= s.v * dt;
        if (s.x < -2) s.x = w + 2;
        const px = s.x + ox;
        const py = s.y + oy;
        if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, width, height]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.75 }}
    />
  );
}

/**
 * Fondo universo full-bleed. Capa fija detrás de todo; z-index negativo y pointer-events: none
 * para que nunca tape interacción ni cree bugs de stacking.
 */
export function UniverseBackground({ enabled = true }: { enabled?: boolean }) {
  const [size, setSize] = useState({ w: 1920, h: 1080 });

  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        maxHeight: '100vh',
        zIndex: UNIVERSE_Z_INDEX,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#0a0e17',
      }}
    >
      <StarfieldCanvas width={size.w} height={size.h} enabled={enabled} />
    </div>
  );
}
