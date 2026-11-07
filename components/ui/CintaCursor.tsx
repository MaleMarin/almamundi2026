'use client';

/**
 * Cursor con una cinta de Inspírate (Ana, 7 nov 2026): detrás del mouse ondea una cinta real,
 * que se estira al moverse y se recoge cuando el mouse se detiene. Una cinta al azar por visita.
 * Solo con mouse (no en pantallas táctiles) y sin «reducir movimiento».
 */
import { useEffect, useRef } from 'react';

/** Colores de las 12 cintas de Inspírate (lib/hilos). */
const CINTAS = ['#DBA81D', '#CF4C12', '#BD1A21', '#DA6D94', '#AAB127', '#278D46', '#0F49A4', '#6D228A', '#9775AD', '#BC1459', '#1A8684', '#681224'];
const PUNTOS = 26;
const ANCHO = 13;

export function CintaCursor() {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = lienzo.current;
    if (!cv) return;
    try {
      if (window.matchMedia('(pointer: coarse)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch {
      return;
    }
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const color = CINTAS[Math.floor(Math.random() * CINTAS.length)]!;

    let dpr = 1;
    const ajustar = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
    };
    ajustar();
    window.addEventListener('resize', ajustar);

    let mx = -100;
    let my = -100;
    let visto = false;
    const pts = Array.from({ length: PUNTOS }, () => ({ x: -100, y: -100 }));
    const mover = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visto) {
        visto = true;
        for (const p of pts) {
          p.x = mx;
          p.y = my;
        }
      }
    };
    const salir = () => {
      visto = false;
      mx = my = -100;
    };
    window.addEventListener('mousemove', mover);
    document.addEventListener('mouseleave', salir);

    let raf = 0;
    const cuadro = (ms: number) => {
      raf = requestAnimationFrame(cuadro);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!visto) return;
      // La cabeza sigue al mouse; cada punto sigue al anterior (la cinta se recoge al detenerse).
      pts[0].x += (mx - pts[0].x) * 0.55;
      pts[0].y += (my - pts[0].y) * 0.55;
      for (let i = 1; i < PUNTOS; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.42;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.42;
      }
      const t = ms / 1000;
      // Bordes de la tira: ancho que se angosta hacia la cola y un vaivén de tela.
      const izq: { x: number; y: number }[] = [];
      const der: { x: number; y: number }[] = [];
      let total = 0;
      for (let i = 0; i < PUNTOS; i++) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(PUNTOS - 1, i + 1)];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        dx /= l;
        dy /= l;
        if (i > 0) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        const nx = -dy;
        const ny = dx;
        const f = i / (PUNTOS - 1);
        const onda = Math.sin(t * 7 - i * 0.55) * f * 4;
        // Torsión: la cinta se da vuelta un poco, como tela, y se ve más angosta en esos puntos.
        const giro = 0.55 + 0.45 * Math.abs(Math.cos(t * 3 - i * 0.35));
        const w = (ANCHO / 2) * (1 - f * 0.55) * giro;
        const cx = pts[i].x + nx * onda;
        const cy = pts[i].y + ny * onda;
        izq.push({ x: cx + nx * w, y: cy + ny * w });
        der.push({ x: cx - nx * w, y: cy - ny * w });
      }
      if (total < 2) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      ctx.moveTo(izq[0]!.x, izq[0]!.y);
      for (const q of izq) ctx.lineTo(q.x, q.y);
      for (let i = der.length - 1; i >= 0; i--) ctx.lineTo(der[i]!.x, der[i]!.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Brillo de tela por el centro, que va y viene a lo largo.
      ctx.save();
      ctx.clip();
      ctx.lineCap = 'round';
      for (let i = 0; i < PUNTOS - 1; i++) {
        const luz = 0.5 + 0.5 * Math.sin(t * 5 - i * 0.6);
        ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.28 * luz})`;
        ctx.lineWidth = ANCHO * 0.28 * (1 - (i / PUNTOS) * 0.5);
        ctx.beginPath();
        ctx.moveTo(pts[i]!.x, pts[i]!.y);
        ctx.lineTo(pts[i + 1]!.x, pts[i + 1]!.y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(cuadro);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', ajustar);
      window.removeEventListener('mousemove', mover);
      document.removeEventListener('mouseleave', salir);
    };
  }, []);

  return (
    <canvas
      ref={lienzo}
      aria-hidden="true"
      className="cinta-cursor"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9997 }}
    />
  );
}
