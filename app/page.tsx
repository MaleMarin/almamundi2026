'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PROPOSITO_TITLE, PROPOSITO_SUBTITLE, PROPOSITO_PARAGRAPHS, PROPOSITO_CIERRE } from '@/lib/proposito-text';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Search,
  Bookmark,
  Filter,
  Grid,
  Check,
  Upload,
  Download,
  Share2,
  RefreshCcw,
  Mail,
  User,
  MapPin,
  Globe2,
  Users,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

// --- Mapa en home: dock + drawer + globo + TimeBar (todas las funciones) ---
const HomeMap = dynamic(() => import('@/components/map/HomeMap').then((m) => m.default), { ssr: false });

import { uploadFileToStorage } from '@/lib/firebase/upload';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';

/* ------------------------------------------------------------------ */
/* THEME: NEUMÓRFICO (SOFT UI)                                         */
/* ------------------------------------------------------------------ */
const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px'
  },
  inset: {
    backgroundColor: '#E0E5EC',
    boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '30px'
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT
  }
} as const;

const globalStyles = `
  html { scroll-behavior: smooth; }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin-slow { animation: spin 8s linear infinite; }

  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .engraved-text {
    color: #E0E5EC;
    text-shadow: 2px 2px 5px rgba(163,177,198,0.7), -2px -2px 5px rgba(255,255,255,0.8);
  }

`;

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
type Mode = 'Video' | 'Audio' | 'Texto' | 'Foto';

type StoryPoint = {
  lat: number;
  lng: number;
  label: string;
};

type NewsRing = {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
};

type AgeRange = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'Prefiero no decir';
type Sex = 'Mujer' | 'Hombre' | 'No binario' | 'Otro' | 'Prefiero no decir';

type InspirationTopic = {
  title: string;
  questions: string[];
};

const INSPIRATION_TOPICS: InspirationTopic[] = [
  {
    title: 'Un momento que me cambió',
    questions: ['¿Qué pasó exactamente?', '¿Qué sentiste en el cuerpo en ese momento?', '¿Qué cambió en ti después?', '¿Qué aprendiste que antes no veías?']
  },
  {
    title: 'Una decisión difícil',
    questions: ['¿Qué opciones tenías?', '¿Qué era lo que más te daba miedo perder?', '¿Qué te ayudó a decidir?', 'Si pudieras volver atrás, ¿harías algo distinto?']
  },
  {
    title: 'Un comienzo',
    questions: ['¿Cómo empezó esta historia?', '¿Qué detalle pequeño te quedó grabado?', '¿Qué esperabas que pasara?', '¿Qué pasó en realidad?']
  },
  {
    title: 'Un final',
    questions: ['¿Qué terminó (una etapa, una relación, un lugar)?', '¿Cómo te diste cuenta de que era el final?', '¿Qué se fue contigo y qué quedó?', '¿Qué te gustaría que otros entiendan de este cierre?']
  },
  {
    title: 'Un lugar que guardo adentro',
    questions: ['¿Dónde es? (ciudad, barrio, casa, paisaje)', '¿Qué tiene ese lugar que no se repite?', '¿Qué pasó ahí que todavía te acompaña?', '¿Qué olerías/escucharías si estuvieras ahí ahora?']
  },
  {
    title: 'Una persona que me marcó',
    questions: ['¿Quién era para ti?', '¿Qué hacía o decía que no olvidas?', '¿Qué parte de ti apareció gracias a esa persona?', '¿Qué le dirías hoy si la tuvieras al frente?']
  },
  {
    title: 'Una pérdida',
    questions: ['¿Qué perdiste y qué significaba?', '¿Cómo cambió tu vida desde entonces?', '¿Qué te sostuvo en lo peor?', '¿Qué te gustaría que otros no olviden de esto?']
  },
  {
    title: 'Un duelo (sin apuro)',
    questions: ['¿Cómo se ve el duelo en tu día a día?', '¿Qué cosas pequeñas te lo recuerdan?', '¿Qué te ayuda aunque sea un 1%?', '¿Qué te gustaría pedirle al mundo en este momento?']
  },
  {
    title: 'Un logro (grande o pequeño)',
    questions: ['¿Qué lograste exactamente?', '¿Qué costo tuvo por dentro?', '¿Quién te acompañó (o quién faltó)?', '¿Qué te demuestra este logro sobre ti?']
  },
  {
    title: 'Un miedo',
    questions: ['¿A qué le tienes miedo de verdad?', '¿Cuándo apareció por primera vez?', '¿Qué haces para seguir igual aunque esté ahí?', '¿Qué te gustaría que pase para sentir más calma?']
  },
  {
    title: 'Mi relación con la tecnología',
    questions: ['¿Qué lugar ocupa la tecnología en tu vida?', '¿Qué te conecta y qué te satura?', '¿Qué límites te gustaría poner?', '¿Qué te gustaría recuperar (tiempo, calma, atención)?']
  },
  {
    title: 'Un futuro que imagino',
    questions: ['¿Qué futuro imaginas (realista, deseado, posible)?', '¿Qué te gustaría que no se repita del pasado?', '¿Qué quieres que sí exista?', '¿Qué primer paso pequeño te acercaría a eso?']
  }
];

/* ------------------------------------------------------------------ */
/* HOOKS                                                               */
/* ------------------------------------------------------------------ */
function useModalUX(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(900);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 900;
      setWidth(w);
    });

    ro.observe(el);
    requestAnimationFrame(() => setWidth(el.clientWidth || 900));

    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

/* ------------------------------------------------------------------ */
/* UTILS                                                               */
/* ------------------------------------------------------------------ */
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function makeId(prefix = 'AM') {
  const s = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `${prefix}-${s}`;
}

function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function hslFromHash(h: number, offset = 0) {
  const hue = (h + offset) % 360;
  return `hsl(${hue} 85% 55%)`;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function formatSeconds(s: number) {
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return { mm, ss };
}

function isEmailLike(v: string) {
  // simple, suficiente para UI (la validación real va server-side)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function pickMimeType(preferred: string[]) {
  const MR = typeof window !== 'undefined' ? window.MediaRecorder : undefined;
  if (!MR?.isTypeSupported) return '';
  for (const t of preferred) {
    try {
      if (MR.isTypeSupported(t)) return t;
    } catch {}
  }
  return '';
}

async function blobToAmplitudeSamples(blob: Blob, target = 160) {
  try {
    const arr = await blob.arrayBuffer();
    const w = typeof window !== 'undefined' ? window : undefined;
    const AudioCtx = w?.AudioContext || (w as Window & { webkitAudioContext?: typeof AudioContext })?.webkitAudioContext;
    if (!AudioCtx) return Array.from({ length: target }, () => 0.2);

    const ctx = new AudioCtx();
    const audio = await ctx.decodeAudioData(arr.slice(0));
    const data = audio.getChannelData(0);
    const step = Math.floor(data.length / target) || 1;

    const out: number[] = [];
    for (let i = 0; i < target; i++) {
      const start = i * step;
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step && start + j < data.length; j++) {
        sum += Math.abs(data[start + j]);
        count++;
      }
      out.push(clamp(sum / Math.max(1, count), 0, 1));
    }

    ctx.close?.().catch?.(() => {});
    return out;
  } catch {
    return Array.from({ length: target }, () => 0.2);
  }
}

/* ------------------------------------------------------------------ */
/* IMPRENTA VISUALIZER                                                 */
/* ------------------------------------------------------------------ */
/** La impronta se dibuja con ondas y puntos. Si animate=false (ej. historia escrita), queda fija; si animate=true (ej. audio), se anima. */
function ImprontaVisualizer({
  isActive,
  seedText,
  audioBlob,
  canvasId,
  animate = true
}: {
  isActive: boolean;
  seedText: string;
  audioBlob: Blob | null;
  canvasId?: string;
  animate?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amps, setAmps] = useState<number[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!audioBlob) {
      queueMicrotask(() => setAmps(null));
      return;
    }
    blobToAmplitudeSamples(audioBlob).then((a) => {
      if (alive) setAmps(a);
    });
    return () => {
      alive = false;
    };
  }, [audioBlob]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const h = hashString(seedText || 'almamundi');
    const c1 = hslFromHash(h, 10);
    const c2 = hslFromHash(h, 120);
    const c3 = hslFromHash(h, 220);

    const draw = () => {
      const w = canvas.width;
      const hh = canvas.height;

      ctx.clearRect(0, 0, w, hh);
      if (!isActive) return;

      ctx.fillStyle = soft.bg;
      ctx.fillRect(0, 0, w, hh);

      if (animate) t += 0.03;

      const grad = ctx.createRadialGradient(w * 0.5, hh * 0.45, 20, w * 0.5, hh * 0.45, Math.max(w, hh));
      grad.addColorStop(0, 'rgba(249,115,22,0.15)');
      grad.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, hh);

      ctx.beginPath();
      ctx.moveTo(0, hh / 2);
      for (let x = 0; x < w; x++) {
        const base = Math.sin(x * 0.018 + t) * 18;
        const mod = Math.cos(x * 0.04 - t * 1.2) * 9;
        const y = hh / 2 + base + mod + Math.sin(t * 0.6) * 3;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, hh / 2);
      for (let x = 0; x < w; x++) {
        const y = hh / 2 + Math.sin(x * 0.03 - t * 1.8) * 12;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.30)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const dots = 18;
      for (let i = 0; i < dots; i++) {
        const px = ((h % 997) / 997) * w;
        const phase = (i * 0.7 + (h % 100) / 50) * 2;
        const x = (px + i * 19 + Math.sin(t + phase) * 16) % w;
        const y = hh * 0.25 + ((i * 37 + h) % 120) + Math.cos(t * 1.2 + i) * 10;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? c2 : i % 3 === 1 ? c3 : 'rgba(249,115,22,0.65)';
        ctx.fill();
      }

      if (amps && amps.length) {
        const mid = hh * 0.78;
        const maxH = 34;
        ctx.beginPath();
        for (let i = 0; i < amps.length; i++) {
          const x = (i / (amps.length - 1)) * w;
          const a = amps[i] ?? 0.2;
          const y = mid - a * maxH;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(74,85,104,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (animate) raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [isActive, seedText, amps, animate]);

  return <canvas id={canvasId} ref={canvasRef} width={520} height={260} className="w-full h-full object-cover opacity-90" />;
}

/** Huella cuadrada: composición geométrica sólida, bordes nítidos (sin blur). */
const HUELLA_SIZE = 400;
const HUELLA_RADIUS = 16;

function ImprontaFromVisualParams({ visualParams, canvasId }: { visualParams: { base?: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }>; core?: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }>; fragmentation?: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }>; modeOverlay?: string }; canvasId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const s = HUELLA_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visualParams) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const drawBlock = (b: { x: number; y: number; w: number; h: number; color: string }) => {
      const left = Math.floor(b.x * s);
      const top = Math.floor(b.y * s);
      const bw = Math.max(1, Math.floor(b.w * s));
      const bh = Math.max(1, Math.floor(b.h * s));
      ctx.fillStyle = b.color;
      ctx.fillRect(left, top, bw, bh);
    };

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, s, s);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, 0, s, s, HUELLA_RADIUS);
    ctx.clip();

    (visualParams.base || []).forEach((b) => drawBlock(b));
    (visualParams.core || []).forEach((b) => drawBlock(b));
    (visualParams.fragmentation || []).forEach((b) => drawBlock(b));

    if (visualParams.modeOverlay) {
      ctx.fillStyle = visualParams.modeOverlay;
      ctx.beginPath();
      roundRect(ctx, 0, 0, s, s, HUELLA_RADIUS);
      ctx.fill();
    }

    ctx.restore();
    ctx.strokeStyle = 'rgba(71,85,105,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, 0, 0, s, s, HUELLA_RADIUS);
    ctx.stroke();
  }, [visualParams]);

  return <canvas id={canvasId} ref={canvasRef} width={s} height={s} className="w-full h-full object-cover rounded-2xl" style={{ imageRendering: 'pixelated' }} />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

/** Huella: cuadrícula densa de rectángulos y píxeles, geométrica sólida, bordes nítidos (razor-sharp). Sin dispersión ni blur. */
function ImprontaDataFingerprint({ seedText, canvasId }: { seedText: string; canvasId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const s = HUELLA_SIZE;
  const GRID = 24;
  const cell = s / GRID;

  const basePalette = [
    'rgba(37, 99, 235, 0.9)',
    'rgba(88, 28, 135, 0.9)',
    'rgba(30, 64, 175, 0.9)',
    'rgba(109, 40, 217, 0.9)',
  ];
  const corePalette = [
    'rgba(0, 212, 255, 0.95)',
    'rgba(219, 39, 119, 0.95)',
    'rgba(234, 88, 12, 0.95)',
  ];
  const fragPalette = [
    'rgba(250, 204, 21, 0.95)',
    'rgba(34, 197, 94, 0.95)',
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const h0 = hashString(seedText || 'fp');
    const seeded = (i: number) => ((h0 * (i + 1) * 2654435761) >>> 0) / 0xffffffff;

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, s, s);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, 0, s, s, HUELLA_RADIUS);
    ctx.clip();

    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const iw = Math.max(1, Math.floor(w));
      const ih = Math.max(1, Math.floor(h));
      ctx.fillStyle = color;
      ctx.fillRect(ix, iy, iw, ih);
    };

    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const i = gy * GRID + gx;
        const t = seeded(i * 7);
        if (t < 0.4) continue;
        const color = basePalette[Math.floor(seeded(i * 11) * basePalette.length)]!;
        rect(gx * cell, gy * cell, cell + 1, cell + 1, color);
      }
    }
    for (let b = 0; b < 20; b++) {
      const gx = Math.floor(seeded(b * 13) * (GRID - 2));
      const gy = Math.floor(seeded(b * 17) * (GRID - 2));
      const w = 2 + Math.floor(seeded(b * 19) * 3);
      const h = 2 + Math.floor(seeded(b * 23) * 3);
      const color = corePalette[Math.floor(seeded(b * 29) * corePalette.length)]!;
      rect(gx * cell, gy * cell, w * cell, h * cell, color);
    }
    for (let p = 0; p < 80; p++) {
      const gx = Math.floor(seeded(p * 31) * GRID);
      const gy = Math.floor(seeded(p * 37) * GRID);
      const color = fragPalette[Math.floor(seeded(p * 41) * fragPalette.length)]!;
      rect(gx * cell, gy * cell, cell, cell, color);
    }

    ctx.restore();
    ctx.strokeStyle = 'rgba(71,85,105,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, 0, 0, s, s, HUELLA_RADIUS);
    ctx.stroke();
  }, [seedText]);

  return <canvas id={canvasId} ref={canvasRef} width={s} height={s} className="w-full h-full object-cover rounded-2xl" style={{ imageRendering: 'pixelated' }} />;
}

/** Huella visual para historia por escrito: círculo con bloques de color superpuestos (azules, púrpura, amarillo, verde, rosa). */
function ImprontaCircularBlocks({ seedText, canvasId }: { seedText: string; canvasId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = 520;
  const h = 260;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 118;

  const palette = [
    'rgba(30, 95, 116, 0.85)',   // cerulean
    'rgba(37, 99, 235, 0.82)',   // electric blue
    'rgba(124, 58, 237, 0.80)',  // purple
    'rgba(234, 179, 8, 0.75)',   // warm yellow
    'rgba(244, 114, 182, 0.78)', // soft pink
    'rgba(22, 163, 74, 0.80)',   // green
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const h0 = hashString(seedText || 'text');
    const seeded = (i: number) => ((h0 * (i + 1) * 2654435761) >>> 0) / 0xffffffff;

    const blocks: { x: number; y: number; w: number; h: number; color: string; rot: number }[] = [];
    const n = 48;
    for (let i = 0; i < n; i++) {
      const r = seeded(i * 7) * radius * 0.92;
      const th = seeded(i * 13) * Math.PI * 2;
      const bx = cx + Math.cos(th) * r * 0.6;
      const by = cy + Math.sin(th) * r * 0.6;
      const bw = 28 + seeded(i * 19) * 80;
      const bh = 18 + seeded(i * 23) * 60;
      const colorIdx = i < 12 ? Math.floor(seeded(i * 31) * 3) : 2 + Math.floor(seeded(i * 41) * 4);
      blocks.push({
        x: bx - bw / 2,
        y: by - bh / 2,
        w: bw,
        h: bh,
        color: palette[colorIdx % palette.length],
        rot: seeded(i * 53) * 0.4 - 0.2
      });
    }

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    blocks.forEach((b) => {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(b.rot);
      ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });

    ctx.restore();
    ctx.strokeStyle = 'rgba(100,116,139,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [seedText]);

  return <canvas id={canvasId} ref={canvasRef} width={w} height={h} className="w-full h-full object-cover opacity-95 rounded-full" />;
}

/** Huella visual para historia en video: paleta dinámica (magenta, cyan, naranja), núcleo púrpura/verde, fragmentos amarillo/rojo/teal. */
function ImprontaCircularBlocksVideo({ seedText, canvasId }: { seedText: string; canvasId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = 520;
  const h = 260;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 118;

  const corePalette = [
    'rgba(88, 28, 135, 0.88)',   // darker purple (narrative depth)
    'rgba(21, 94, 67, 0.86)',    // deep green
    'rgba(127, 0, 127, 0.82)',   // magenta
  ];
  const outerPalette = [
    'rgba(0, 229, 255, 0.80)',   // electric cyan
    'rgba(234, 88, 12, 0.84)',   // deep orange
    'rgba(250, 204, 21, 0.78)',  // yellow (fast action)
    'rgba(239, 68, 68, 0.82)',   // red
    'rgba(45, 212, 191, 0.78)',  // light teal
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const h0 = hashString(seedText || 'video');
    const seeded = (i: number) => ((h0 * (i + 1) * 2654435761) >>> 0) / 0xffffffff;

    const blocks: { x: number; y: number; w: number; h: number; color: string; rot: number }[] = [];
    const n = 56;
    for (let i = 0; i < n; i++) {
      const r = seeded(i * 7) * radius * 0.95;
      const th = seeded(i * 13) * Math.PI * 2;
      const bx = cx + Math.cos(th) * r * 0.65;
      const by = cy + Math.sin(th) * r * 0.65;
      const isCore = r < radius * 0.45;
      const isLarge = isCore || seeded(i * 17) > 0.6;
      const bw = isLarge ? 44 + seeded(i * 19) * 72 : 16 + seeded(i * 19) * 38;
      const bh = isLarge ? 32 + seeded(i * 23) * 52 : 12 + seeded(i * 23) * 26;
      const palette = isCore ? corePalette : outerPalette;
      const colorIdx = Math.floor(seeded(i * 31) * palette.length);
      blocks.push({
        x: bx - bw / 2,
        y: by - bh / 2,
        w: bw,
        h: bh,
        color: palette[colorIdx % palette.length]!,
        rot: seeded(i * 53) * 0.5 - 0.25
      });
    }

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    blocks.forEach((b) => {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(b.rot);
      ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });

    ctx.restore();
    ctx.strokeStyle = 'rgba(100,116,139,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [seedText]);

  return <canvas id={canvasId} ref={canvasRef} width={w} height={h} className="w-full h-full object-cover opacity-95 rounded-full" />;
}

/** Huella visual para historia en audio: espectrograma codificado — graves (teal/verde/azul) abajo, agudos (amarillo/magenta) arriba; tamaño por intensidad. */
function ImprontaCircularBlocksAudio({ seedText, audioBlob, canvasId }: { seedText: string; audioBlob: Blob | null; canvasId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amps, setAmps] = useState<number[] | null>(null);
  const w = 520;
  const h = 260;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 118;

  const lowFreqPalette = [
    'rgba(20, 94, 97, 0.86)',   // deep teal
    'rgba(21, 71, 52, 0.88)',   // forest green
    'rgba(30, 58, 138, 0.84)',  // dark blue
  ];
  const highFreqPalette = [
    'rgba(250, 204, 21, 0.82)',  // bright yellow
    'rgba(236, 72, 153, 0.85)',  // intense magenta
    'rgba(244, 114, 182, 0.80)', // magenta
  ];

  useEffect(() => {
    if (!audioBlob) {
      queueMicrotask(() => setAmps(null));
      return;
    }
    let alive = true;
    blobToAmplitudeSamples(audioBlob, 80).then((a) => {
      if (alive) setAmps(a);
    });
    return () => { alive = false; };
  }, [audioBlob]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const h0 = hashString(seedText || 'audio');
    const seeded = (i: number) => ((h0 * (i + 1) * 2654435761) >>> 0) / 0xffffffff;
    const amp = (i: number) => (amps && amps.length) ? (amps[Math.min(i % amps.length, amps.length - 1)] ?? 0.3) : 0.5;

    const blocks: { x: number; y: number; w: number; h: number; color: string; rot: number }[] = [];
    const n = 54;
    for (let i = 0; i < n; i++) {
      const r = seeded(i * 7) * radius * 0.92;
      const th = seeded(i * 13) * Math.PI * 2;
      const bx = cx + Math.cos(th) * r * 0.62;
      const by = cy + Math.sin(th) * r * 0.62;
      const isLower = by >= cy;
      const palette = isLower ? lowFreqPalette : highFreqPalette;
      const colorIdx = Math.floor(seeded(i * 31) * palette.length);
      const intensity = 0.6 + amp(i) * 0.5;
      if (isLower) {
        const bw = 36 + seeded(i * 19) * 70 + intensity * 20;
        const bh = 24 + seeded(i * 23) * 48 + intensity * 16;
        blocks.push({
          x: bx - bw / 2,
          y: by - bh / 2,
          w: bw,
          h: bh,
          color: palette[colorIdx % palette.length]!,
          rot: seeded(i * 53) * 0.35 - 0.15
        });
      } else {
        const bw = 14 + seeded(i * 19) * 32 + intensity * 12;
        const bh = 10 + seeded(i * 23) * 24 + intensity * 10;
        blocks.push({
          x: bx - bw / 2,
          y: by - bh / 2,
          w: bw,
          h: bh,
          color: palette[colorIdx % palette.length]!,
          rot: seeded(i * 53) * 0.4 - 0.2
        });
      }
    }

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    blocks.forEach((b) => {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(b.rot);
      ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });

    ctx.restore();
    ctx.strokeStyle = 'rgba(100,116,139,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [seedText, amps]);

  return <canvas id={canvasId} ref={canvasRef} width={w} height={h} className="w-full h-full object-cover opacity-95 rounded-full" />;
}

/** Extrae paleta dominante de una imagen (warm: naranjas/rosas/amarillos; cool: verdes/teals/azules). */
function extractPaletteFromImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
): { palette: string[]; isWarm: boolean } {
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const samples: { r: number; g: number; b: number; h: number; s: number; l: number }[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]! / 255;
    const g = data[i + 1]! / 255;
    const b = data[i + 2]! / 255;
    const a = data[i + 3]! / 255;
    const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    if (l < 0.12 || l > 0.95 || a < 0.2) continue;
    let h_ = 0;
    const c = Math.max(r, g, b) - Math.min(r, g, b);
    if (c > 0) {
      if (Math.max(r, g, b) === r) h_ = ((g - b) / c) % 6;
      else if (Math.max(r, g, b) === g) h_ = (b - r) / c + 2;
      else h_ = (r - g) / c + 4;
      h_ = (h_ / 6 + 1) % 1;
    }
    const s = l === 0 || l === 1 ? 0 : c / (1 - Math.abs(2 * l - 1));
    samples.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]!, h: h_ * 360, s, l });
  }
  if (samples.length < 10) {
    const def = ['rgba(249,115,22,0.85)', 'rgba(251,146,60,0.82)', 'rgba(234,179,8,0.8)', 'rgba(244,114,182,0.78)', 'rgba(251,113,133,0.8)', 'rgba(34,197,94,0.78)'];
    return { palette: def, isWarm: true };
  }
  const avgH = samples.reduce((a, s) => a + s.h, 0) / samples.length;
  const isWarm = avgH >= 0 && avgH <= 70 || avgH >= 320;
  const sorted = [...samples].sort((a, b) => (b.s * b.l) - (a.s * a.l));
  const top = sorted.slice(0, 60);
  const bucket = (arr: typeof samples, n: number) => {
    const step = Math.max(1, Math.floor(arr.length / n));
    const out: string[] = [];
    for (let i = 0; i < n && i * step < arr.length; i++) {
      const s = arr[i * step]!;
      out.push(`rgba(${Math.round(s.r)},${Math.round(s.g)},${Math.round(s.b)},0.82)`);
    }
    return out;
  };
  if (isWarm) {
    const warm = top.filter((s) => (s.h >= 0 && s.h <= 70) || s.h >= 320);
    const palette = warm.length >= 4 ? bucket(warm, 6) : [
      'rgba(249,115,22,0.85)', 'rgba(251,146,60,0.82)', 'rgba(234,179,8,0.8)',
      'rgba(244,114,182,0.78)', 'rgba(251,113,133,0.8)', 'rgba(253,186,116,0.8)'
    ];
    return { palette, isWarm: true };
  }
  const cool = top.filter((s) => s.h >= 140 && s.h <= 260);
  const palette = cool.length >= 4 ? bucket(cool, 6) : [
    'rgba(30,95,116,0.85)', 'rgba(37,99,235,0.82)', 'rgba(20,184,166,0.8)',
    'rgba(22,163,74,0.8)', 'rgba(59,130,246,0.78)', 'rgba(34,211,238,0.8)'
  ];
  return { palette, isWarm: false };
}

/** Huella circular para historia en foto: paleta extraída de la imagen, bloques superpuestos. */
function ImprontaFromPhoto({ imageFile, seedText, canvasId }: { imageFile: File; seedText: string; canvasId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const w = 520;
  const h = 260;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 118;

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      const off = document.createElement('canvas');
      off.width = 64;
      off.height = 64;
      const ctx = off.getContext('2d');
      if (ctx) {
        const { palette: p } = extractPaletteFromImage(ctx, img, 64, 64);
        setPalette(p);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, w, h);
    if (palette.length === 0) {
      ctx.fillStyle = 'rgba(100,116,139,0.4)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generando huella…', cx, cy);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,116,139,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    const h0 = hashString(seedText || 'photo');
    const seeded = (i: number) => ((h0 * (i + 1) * 2654435761) >>> 0) / 0xffffffff;

    const blocks: { x: number; y: number; w: number; h: number; color: string; rot: number }[] = [];
    const n = 52;
    for (let i = 0; i < n; i++) {
      const r = seeded(i * 7) * radius * 0.92;
      const th = seeded(i * 13) * Math.PI * 2;
      const bx = cx + Math.cos(th) * r * 0.6;
      const by = cy + Math.sin(th) * r * 0.6;
      const isLarge = i < 14;
      const bw = isLarge ? 50 + seeded(i * 19) * 70 : 18 + seeded(i * 19) * 35;
      const bh = isLarge ? 36 + seeded(i * 23) * 50 : 14 + seeded(i * 23) * 28;
      const colorIdx = Math.floor(seeded(i * 31) * palette.length);
      blocks.push({
        x: bx - bw / 2,
        y: by - bh / 2,
        w: bw,
        h: bh,
        color: palette[colorIdx % palette.length]!,
        rot: seeded(i * 53) * 0.35 - 0.15
      });
    }

    ctx.fillStyle = soft.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    blocks.forEach((b) => {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(b.rot);
      ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(100,116,139,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [palette, seedText]);

  return <canvas id={canvasId} ref={canvasRef} width={w} height={h} className="w-full h-full object-cover opacity-95 rounded-full" />;
}

/* =========================    MAP TOOLBAR (CÁPSULA)    ========================= */
function MapFilterBar({ onToggleView }: { onToggleView: () => void }) {
  const [q, setQ] = useState('');
  return (
    <div
      className="absolute left-0 w-full z-[80] flex justify-center px-4 pointer-events-none"
      style={{ top: 'calc(50% - 520px)' }}
    >
      <div
        className="pointer-events-auto flex items-center gap-4 p-3 rounded-full animate-float"
        style={{
          backgroundColor: 'rgba(224, 229, 236, 0.82)',
          backdropFilter: 'blur(12px)',
          boxShadow: soft.flat.boxShadow,
          border: '1px solid rgba(255,255,255,0.35)',
          fontFamily: APP_FONT
        }}
      >
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Buscar ciudad…"
            className="pl-12 pr-6 py-3 rounded-full w-44 md:w-56 focus:w-80 transition-all duration-300 outline-none text-sm font-bold text-gray-600 placeholder-gray-400"
            style={{ backgroundColor: soft.bg, boxShadow: soft.inset.boxShadow, fontFamily: APP_FONT }}
          />
        </div>

        <div className="h-8 w-px bg-gray-300/70 mx-1 hidden md:block" />

        <button
          type="button"
          className="hidden md:flex items-center gap-2 px-5 py-3 rounded-full text-gray-600 hover:text-orange-600 transition-colors active:scale-95"
          style={soft.button}
        >
          <Filter size={18} />
          <span className="text-sm font-bold">Temas</span>
        </button>

        <button
          type="button"
          onClick={onToggleView}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-gray-600 hover:text-orange-600 transition-colors active:scale-95"
          style={soft.button}
        >
          <Grid size={18} />
          <span className="text-sm font-bold hidden md:inline">Explorar</span>
        </button>

        <div className="h-8 w-px bg-gray-300/70 mx-1" />

        <button
          type="button"
          className="w-12 h-12 flex items-center justify-center rounded-full text-orange-500 hover:text-orange-600 transition-colors active:scale-95 relative"
          style={soft.button}
          aria-label="Mis colecciones"
        >
          <Bookmark size={20} className="fill-current opacity-50" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#E0E5EC]" />
        </button>
      </div>
    </div>
  );
}

/* =========================    MAP LEGEND (CUADRO DER)    ========================= */
function MapLegend() {
  return (
    <div className="absolute top-32 right-6 z-[2] hidden lg:block w-[320px] max-w-[calc(100vw-48px)] pointer-events-auto">
      {/* Capa base: mismo gradiente del mapa (--bg0/--bg1/--bg2) */}
      <div
        className="absolute inset-0 rounded-[26px]"
        style={{
          background: 'linear-gradient(to bottom, var(--bg0) 0%, var(--bg1) 40%, var(--bg2) 100%)',
          zIndex: 0,
        }}
      />
      {/* Capa glass oscura (dark liquid glass), sin blanco */}
      <div
        className="relative p-6 rounded-[26px] border border-white/10 shadow-lg backdrop-blur-md animate-float"
        style={{
          fontFamily: APP_FONT,
          background: 'rgba(0,0,0,0.35)',
          WebkitBackdropFilter: 'blur(18px) saturate(120%)',
          backdropFilter: 'blur(18px) saturate(120%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          zIndex: 1,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(var(--almamundi-orange-rgb),0.6)]" />
          <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">Historias (Memoria)</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Pulsos (Actualidad)</span>
        </div>

        <div className="h-px w-full bg-white/10 mb-3" />

        <p className="text-[11px] text-gray-300 leading-relaxed font-light italic">
          “Dos capas, un mismo mundo: lo vivido y lo que está pasando.”
        </p>
      </div>
    </div>
  );
}

function SoftCard({
  title,
  subtitle,
  children,
  buttonLabel,
  onClick,
  delay
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  buttonLabel: string;
  onClick: () => void;
  delay: string;
}) {
  return (
    <div
      className="relative p-6 rounded-[40px] flex flex-col items-start transition-all duration-500 hover:-translate-y-2 group animate-float w-full max-w-[320px] min-h-[380px] flex-1"
      style={{ ...soft.flat, animationDelay: delay, fontFamily: APP_FONT }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-light text-gray-500">{title}</h3>
        <h2 className="text-2xl font-bold text-gray-700 leading-none">{subtitle}</h2>
      </div>
      <div className="flex-1 min-h-[72px]" />
      <div className="w-full">
        <p className="text-gray-500 leading-relaxed text-base mb-5">{children}</p>
        <button
          onClick={onClick}
          className="w-full flex justify-center px-8 py-4 rounded-full text-xs font-black tracking-widest text-orange-500 uppercase transition-all active:scale-95 group-hover:text-orange-600"
          style={soft.button}
          type="button"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MODALS */
/* ------------------------------------------------------------------ */
function HowItWorksModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useModalUX(isOpen, onClose);
  if (!isOpen) return null;

  const content = (
    <>
        <p className="text-gray-600 leading-relaxed mb-6">
        AlmaMundi es un lugar para que tu historia no se pierda en el ruido.
      </p>
      <p className="text-gray-600 leading-relaxed mb-8">
        Aquí puedes compartir algo que viviste, pensaste o sentiste, y verlo conectado con el mundo.
      </p>

      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-3">1. Tú compartes (desde tu computador o tu celular)</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          Participar es simple y no necesitas descargar nada.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          Desde la web, en tu computador o en tu teléfono, puedes:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-1">
          <li>Escribir tu historia.</li>
          <li>Grabar un audio.</li>
          <li>Subir una fotografía.</li>
          <li>Subir un video.</li>
          <li>Compartir un enlace (por ejemplo, una canción, una pieza musical o un documento que complemente tu relato).</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-3">
          El proceso es guiado y toma solo unos minutos:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-1">
          <li>Eliges el formato.</li>
          <li>Escribes o subes tu contenido.</li>
          <li>Indicas la ciudad relacionada con tu historia.</li>
          <li>Dejas tu correo electrónico.</li>
          <li>Envías.</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-3">
          El correo se solicita únicamente para avisarte cuando tu historia haya sido publicada en el mapa. No se hace público ni se utiliza con otros fines.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          Cada historia es revisada antes de aparecer, para mantener un espacio respetuoso y cuidado.
        </p>
        <p className="text-gray-600 leading-relaxed font-semibold mb-2">Límites de cada formato</p>
        <p className="text-gray-600 leading-relaxed mb-3">
          Para que la experiencia sea clara y equilibrada:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-1">
          <li>Los videos y audios pueden durar hasta 5 minutos.</li>
          <li>Los textos pueden tener hasta 2 carillas.</li>
          <li>Puedes subir hasta 3 fotografías por historia.</li>
          <li>Puedes compartir todas las historias que quieras.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-3">2. Tu historia aparece en el mapa</h3>
        <p className="text-gray-600 leading-relaxed mb-3">
          Cuando tu historia es publicada, se ubica en el Mapa de AlmaMundi, conectada a la ciudad que elegiste.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          Durante 15 días, tu relato forma parte del mapa vivo: personas de distintos lugares pueden descubrirlo mientras exploran el mundo.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Es un momento especial: tu historia dialoga con otras y se convierte en parte del tejido del mapa.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-3">3. Después, tu historia permanece</h3>
        <p className="text-gray-600 leading-relaxed mb-3">
          Pasados los 15 días en el mapa, tu historia no desaparece.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          Pasa a formar parte de las Muestras de AlmaMundi, donde queda disponible para ser encontrada por:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-1">
          <li>Palabras clave.</li>
          <li>Ciudad.</li>
          <li>Tema.</li>
          <li>Formato (texto, audio, foto o video).</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-2">
          El mapa es la experiencia viva.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Las muestras son el archivo que permanece.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-3">4. Historias, Sonidos y Noticias</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          AlmaMundi tiene tres formas de explorar el mundo:
        </p>
        <p className="text-gray-600 leading-relaxed mb-2 font-semibold">Historias</p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Son los relatos personales que las personas comparten. Son memoria viva.
        </p>
        <p className="text-gray-600 leading-relaxed mb-2 font-semibold">Sonidos</p>
        <p className="text-gray-600 leading-relaxed mb-4">
          No son solo ambiente. También son una forma de encontrar historias.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          Cuando en un relato aparecen palabras como &quot;mar&quot;, &quot;ciudad&quot;, &quot;bosque&quot;, &quot;protesta&quot;, &quot;lluvia&quot; o &quot;mercado&quot;, esas historias pueden vincularse a ciertos paisajes sonoros.
          Así, puedes explorar el mapa no solo por ciudad o tema, sino también por atmósfera.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Si eliges un sonido, descubrirás historias que conectan con ese entorno o experiencia.
        </p>
        <p className="text-gray-600 leading-relaxed mb-2 font-semibold">Noticias</p>
        <p className="text-gray-600 leading-relaxed">
          Muestran lo que está ocurriendo hoy en el mundo y permiten conectar lo íntimo con lo colectivo, lo personal con lo global.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-3">5. Un espacio en movimiento</h3>
        <p className="text-gray-600 leading-relaxed">
          El equipo de AlmaMundi crea constantemente muestras públicas temáticas: memoria, migración, identidad, ciudad, naturaleza, cultura, educación y otros temas que atraviesan nuestra vida contemporánea.
        </p>
        <p className="text-gray-600 leading-relaxed mt-3">
          Estas muestras reúnen historias desde distintos lugares y permiten mirarlas en conjunto.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Privacidad</h3>
        <p className="text-gray-600 leading-relaxed mb-3">
          Tu información es tratada con respeto y cuidado.
          Puedes revisar nuestra Política de Privacidad aquí:{' '}
          <a href="/privacidad" className="text-[var(--almamundi-orange)] font-semibold underline hover:no-underline">
            Política de Privacidad
          </a>
        </p>
      </section>

      <p className="text-gray-700 font-semibold leading-relaxed">
        AlmaMundi no es una red social.
        <br />
        Es un espacio para dejar huella.
      </p>
    </>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-2xl max-h-[90vh] rounded-[40px] relative shadow-2xl animate-float flex flex-col" style={{ fontFamily: APP_FONT }}>
        <div className="p-10 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-colors active:scale-95"
            style={soft.button}
            aria-label="Cerrar"
            type="button"
          >
            <X size={24} />
          </button>
          <h2 className="text-3xl font-bold text-gray-700 pr-12">¿Cómo funciona AlmaMundi?</h2>
        </div>
        <div className="px-10 pb-10 overflow-y-auto hide-scrollbar flex-1 min-h-0">
          {content}
        </div>
      </div>
    </div>
  );
}

function PurposeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useModalUX(isOpen, onClose);
  if (!isOpen) return null;

  const purposeContent = (
    <>
      <p className="text-gray-600 leading-relaxed mb-4 font-semibold">
        {PROPOSITO_TITLE}
      </p>
      {PROPOSITO_SUBTITLE ? (
        <p className="text-gray-600 leading-relaxed mb-6">
          {(PROPOSITO_SUBTITLE as string).split('\n').map((line: string, i: number) => (
            <span key={i}>{line}{i < 1 ? <br /> : null}</span>
          ))}
        </p>
      ) : null}
      {PROPOSITO_PARAGRAPHS.map((block, i) => {
        if (typeof block === 'string') {
          return <p key={i} className="text-gray-600 leading-relaxed mb-4">{block}</p>;
        }
        if (typeof block === 'object' && block !== null && 'bold' in block) {
          const b = block as { text: string; bold: string };
          return (
            <p key={i} className="text-gray-600 leading-relaxed mb-4">
              {b.text}
              <br />
              <strong>{b.bold}</strong>
            </p>
          );
        }
        const lines = (block as { lines: string[] }).lines;
        return (
          <p key={i} className={`text-gray-600 leading-relaxed ${i === PROPOSITO_PARAGRAPHS.length - 1 ? 'mb-6' : 'mb-4'}`}>
            {lines.map((line, j) => (
              <span key={j}>{line}{j < lines.length - 1 ? <br /> : null}</span>
            ))}
          </p>
        );
      })}
      <p className="text-gray-700 font-semibold leading-relaxed">{PROPOSITO_CIERRE}</p>
    </>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-2xl max-h-[90vh] rounded-[40px] relative shadow-2xl animate-float flex flex-col" style={{ fontFamily: APP_FONT }}>
        <div className="p-10 pb-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-colors active:scale-95"
          style={soft.button}
          aria-label="Cerrar"
          type="button"
        >
          <X size={24} />
        </button>
          <h2 className="text-3xl font-bold text-gray-700 pr-12">Nuestro propósito</h2>
        </div>
        <div className="px-10 pb-10 overflow-y-auto hide-scrollbar flex-1 min-h-0">
          {purposeContent}
        </div>
      </div>
    </div>
  );
}

function BitsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useModalUX(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-2xl max-h-[90vh] rounded-[40px] relative shadow-2xl animate-float flex flex-col" style={{ fontFamily: APP_FONT }}>
        <div className="p-10 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-colors active:scale-95"
            style={soft.button}
            aria-label="Cerrar"
            type="button"
          >
            <X size={24} />
          </button>
          <h2 className="text-3xl font-bold text-gray-700 pr-12">Bits</h2>
        </div>
        <div className="px-10 pb-10 overflow-y-auto hide-scrollbar flex-1 min-h-0">
          <p className="text-gray-600 leading-relaxed mb-4 font-semibold">
            Datos inesperados, vivos y sorprendentes del mundo.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            En el mapa encontrarás pequeñas huellas: curiosidades, paradojas y formas de vivir que no conocías. Cada punto es un bit de realidad que invita a pensar.
          </p>
          <a
            href="#mapa"
            onClick={onClose}
            className="inline-block px-6 py-3 rounded-full font-bold text-gray-700 hover:text-orange-600 transition-colors active:scale-95"
            style={soft.button}
          >
            Ver Bits en el mapa
          </a>
        </div>
      </div>
    </div>
  );
}

function InspirationModal({
  isOpen,
  onClose,
  topics,
  onChoose
}: {
  isOpen: boolean;
  onClose: () => void;
  topics: InspirationTopic[];
  onChoose: (t: InspirationTopic) => void;
}) {
  useModalUX(isOpen, onClose);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setQ('');
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = topics.filter((t) => {
    const s = `${t.title} ${t.questions.join(' ')}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-3xl p-8 md:p-10 rounded-[40px] relative shadow-2xl" style={{ fontFamily: APP_FONT }}>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-colors active:scale-95"
          style={soft.button}
          aria-label="Cerrar"
          type="button"
        >
          <X size={22} />
        </button>

        <div className="mb-6">
          <div className="text-xs font-black tracking-widest uppercase text-gray-500 mb-2">Inspiración</div>
          <h2 className="text-3xl font-bold text-gray-700">Elige un disparador</h2>
          <p className="text-gray-600 mt-2">Selecciona un tema y te prellenamos preguntas guía (solo si escribes).</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tema…"
              className="w-full pl-12 pr-5 py-4 rounded-[18px] outline-none text-gray-700"
              style={{ ...soft.flat, borderRadius: '18px' }}
            />
          </div>
        </div>

        <div className="max-h-[52vh] overflow-y-auto hide-scrollbar pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => onChoose(t)}
                className="text-left p-5 rounded-[22px] active:scale-[0.99] transition-transform"
                style={{ ...soft.inset, borderRadius: '22px' }}
              >
                <div className="text-lg font-black text-gray-700">{t.title}</div>
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  {t.questions.slice(0, 3).map((q2, i) => (
                    <div key={i}>• {q2}</div>
                  ))}
                </div>
                <div className="mt-4 text-xs font-black tracking-widest uppercase text-orange-600">Elegir</div>
              </button>
            ))}
          </div>

          {!filtered.length && <div className="text-gray-500 text-sm py-6 text-center">No encontramos resultados.</div>}
        </div>
      </div>
    </div>
  );
}

function StoryModal({
  isOpen,
  mode,
  onClose,
  onChooseMode,
  chosenTopic,
  onClearChosenTopic
}: {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onChooseMode: (m: Mode) => void; // (lo dejamos para que no cambie tu API, aunque no lo mostramos dentro del modal)
  chosenTopic: InspirationTopic | null;
  onClearChosenTopic: () => void;
}) {
  useModalUX(isOpen, onClose);

  const PRIVACY_URL = '/privacidad';
  const HOME_URL = 'https://almamundi.org';
  const seedForImpronta = 'almamundi-seed-';

  const [step, setStep] = useState<'capture' | 'details' | 'received'>('capture');

  const [storyTitle, setStoryTitle] = useState('');
  const [name, setName] = useState('');
  const [wantsEmail, setWantsEmail] = useState(false);
  const [email, setEmail] = useState('');

  const [ageRange, setAgeRange] = useState<AgeRange | ''>('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [err, setErr] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const imprintIdRef = useRef<string>('');
  const visualParamsRef = useRef<{ base?: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }>; core?: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }>; fragmentation?: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }>; modeOverlay?: string } | null>(null);

  const MAX_TEXT = 6000;
  const isTextTooLong = text.length > MAX_TEXT;

  const revokeMediaUrl = useCallback(() => {
    if (!mediaUrl) return;
    try {
      URL.revokeObjectURL(mediaUrl);
    } catch {}
  }, [mediaUrl]);

  const cleanupStream = useCallback(() => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    if (previewVideoRef.current) {
      try {
        previewVideoRef.current.srcObject = null;
      } catch {}
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    try {
      recorderRef.current?.stop();
    } catch {}
  }, []);

  const imagePreviewUrlRef = useRef<string>('');
  useEffect(() => {
    imagePreviewUrlRef.current = imagePreviewUrl;
  }, [imagePreviewUrl]);

  const hardResetCapture = useCallback(() => {
    setErr('');
    setSecondsLeft(300);
    setIsRecording(false);
    chunksRef.current = [];
    recorderRef.current = null;

    cleanupStream();

    setMediaBlob(null);
    revokeMediaUrl();
    setMediaUrl('');
    setImageFile(null);
    if (imagePreviewUrlRef.current) {
      try {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      } catch {}
      imagePreviewUrlRef.current = '';
      setImagePreviewUrl('');
    }
  }, [cleanupStream, revokeMediaUrl]);

  // Reset modal when opens (or mode changes while open)
  useEffect(() => {
    if (!isOpen) return;

    setStep('capture');
    setStoryTitle('');
    setName('');
    setWantsEmail(false);
    setEmail('');
    setAgeRange('');
    setSex('');
    setCity('');
    setCountry('');
    setAcceptedPrivacy(false);
    setText('');
    setAttachments([]);
    imprintIdRef.current = '';
    visualParamsRef.current = null;

    hardResetCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Stop everything when modal closes
  useEffect(() => {
    if (isOpen) return;
    hardResetCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Prefill from inspiration (only in Texto)
  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'Texto') return;
    if (!chosenTopic) return;

    setStoryTitle((prev) => (prev.trim().length ? prev : chosenTopic.title));
    const guide = chosenTopic.questions.map((q) => `• ${q}`).join('\n');
    setText((prev) => (prev.trim().length ? prev : `${guide}\n\n`));
  }, [isOpen, mode, chosenTopic]);

  // Recording countdown
  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRecording, stopRecording]);

  const startRecording = useCallback(async () => {
    setErr('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErr('Este navegador no permite grabar. Prueba en Chrome o Safari actualizado.');
      return;
    }

    // clear previous
    setMediaBlob(null);
    revokeMediaUrl();
    setMediaUrl('');
    chunksRef.current = [];

    try {
      const constraints: MediaStreamConstraints =
        mode === 'Audio'
          ? { audio: true }
          : {
              audio: true,
              video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === 'Video' && previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.muted = true;
        previewVideoRef.current.play?.().catch?.(() => {});
      }

      const mimeType =
        mode === 'Audio'
          ? pickMimeType(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'])
          : pickMimeType(['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']);

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        try {
          const type = rec.mimeType || (mode === 'Audio' ? 'audio/webm' : 'video/webm');
          const blob = new Blob(chunksRef.current, { type });
          setMediaBlob(blob);

          const url = URL.createObjectURL(blob);
          setMediaUrl(url);
        } catch {
          setErr('No pudimos procesar la grabación.');
        } finally {
          cleanupStream();
        }
      };

      setSecondsLeft(300);
      setIsRecording(true);
      rec.start(250);
    } catch (e: any) {
      cleanupStream();
      setIsRecording(false);

      const msg = String(e?.message || '');
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setErr('No diste permisos de micrófono/cámara. Actívalos y vuelve a intentar.');
      } else {
        setErr('No pudimos iniciar la grabación. Revisa permisos o prueba otro navegador.');
      }
    }
  }, [mode, cleanupStream, revokeMediaUrl]);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    setAttachments((prev) => [...prev, ...incoming].slice(0, 10));
  }, []);

  const removeFile = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const canContinueFromCapture = useMemo(() => {
    if (mode === 'Texto') return text.trim().length >= 30 && !isTextTooLong;
    if (mode === 'Foto') return !!imageFile;
    return !!mediaBlob && !isRecording;
  }, [mode, text, isTextTooLong, mediaBlob, isRecording, imageFile]);

  const canSubmit = useMemo(() => {
    const baseOk = !!sex && !!ageRange && city.trim().length > 1 && country.trim().length > 1 && acceptedPrivacy;
    const emailOk = !wantsEmail || isEmailLike(email);
    return baseOk && emailOk && !saving;
  }, [sex, ageRange, city, country, acceptedPrivacy, wantsEmail, email, saving]);

  const copyHomeLink = useCallback(async () => {
    try {
      if (!navigator?.clipboard?.writeText) throw new Error('no-clipboard');
      await navigator.clipboard.writeText(HOME_URL);
      setErr('Link copiado 💛');
      window.setTimeout(() => setErr(''), 1800);
    } catch {
      setErr('No se pudo copiar el link en este navegador.');
      window.setTimeout(() => setErr(''), 1800);
    }
  }, []);

  const openShare = useCallback(
    (network: 'whatsapp' | 'linkedin' | 'x' | 'facebook' | 'copy' | 'instagram' | 'tiktok' | 'threads' | 'bluesky') => {
      const id = imprintIdRef.current || makeId('AM');
      const shareText = `Mi Impronta en AlmaMundi (${id}).`;
      const url = HOME_URL;

      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(url);

      const open = (u: string) => window.open(u, '_blank', 'noopener,noreferrer');

      if (network === 'copy') {
        copyHomeLink();
        return;
      }

      if (network === 'whatsapp') {
        open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`);
        return;
      }

      if (network === 'linkedin') {
        open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
        return;
      }

      if (network === 'facebook') {
        open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
        return;
      }

      if (network === 'x') {
        open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`);
        return;
      }

      copyHomeLink();
      setErr(
        `Link copiado. Pégalo en ${
          network === 'instagram' ? 'Instagram' : network === 'tiktok' ? 'TikTok' : network === 'threads' ? 'Threads' : 'Bluesky'
        } ✨`
      );
      window.setTimeout(() => setErr(''), 2200);
    },
    [copyHomeLink]
  );

  const shareAlmaMundi = useCallback((network: 'whatsapp' | 'facebook' | 'x' | 'instagram') => {
    const url = HOME_URL;
    const inviteText = 'Suma tu historia al mapa. Alma Mundi: ';
    const fullText = inviteText + url;
    const open = (u: string) => window.open(u, '_blank', 'noopener,noreferrer');
    if (network === 'whatsapp') {
      open(`https://wa.me/?text=${encodeURIComponent(fullText)}`);
      return;
    }
    if (network === 'facebook') {
      open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
      return;
    }
    if (network === 'x') {
      open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteText)}&url=${encodeURIComponent(url)}`);
      return;
    }
    if (network === 'instagram') {
      copyHomeLink();
      setErr('Link copiado. Pégalo en Instagram ✨');
      window.setTimeout(() => setErr(''), 2200);
    }
  }, [copyHomeLink]);

  const downloadImpronta = useCallback(() => {
    const canvas = document.getElementById('impronta-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      setErr('No encontramos la impronta para descargar.');
      window.setTimeout(() => setErr(''), 1800);
      return;
    }

    try {
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const id = imprintIdRef.current || 'AM';
      a.href = png;
      a.download = `AlmaMundi-Impronta-${id}.png`;
      a.click();
    } catch {
      setErr('No se pudo descargar en este navegador.');
      window.setTimeout(() => setErr(''), 1800);
    }
  }, []);

  const submit = useCallback(async () => {
    setErr('');

    if (!canSubmit) {
      setErr('Te falta completar datos obligatorios o aceptar la política de privacidad.');
      window.setTimeout(() => setErr(''), 2200);
      return;
    }

    if (mode === 'Texto' && text.trim().length < 30) {
      setErr('Escribe un poquito más (mínimo unas líneas).');
      window.setTimeout(() => setErr(''), 2200);
      return;
    }
    if (mode === 'Foto' && !imageFile) {
      setErr('Primero elige una fotografía.');
      window.setTimeout(() => setErr(''), 2200);
      return;
    }
    if (mode !== 'Texto' && mode !== 'Foto' && !mediaBlob) {
      setErr('Primero graba tu audio/video.');
      window.setTimeout(() => setErr(''), 2200);
      return;
    }

    setSaving(true);

    try {
      const formatMap = { Video: 'video', Audio: 'audio', Texto: 'text', Foto: 'image' } as const;
      const apiFormat = formatMap[mode];

      const placeLabel = [city.trim(), country.trim()].filter(Boolean).join(', ') || 'Sin lugar';
      const authorEmailVal = wantsEmail && email.trim() ? email.trim() : 'noreply@almamundi.org';
      const titleVal = storyTitle.trim() || 'Mi historia';

      let media: { audioUrl?: string; videoUrl?: string; imageUrl?: string } = {};

      if (mode === 'Foto' && imageFile) {
        const imageUrl = await uploadFileToStorage(imageFile, 'submissions', imageFile.name);
        media = { imageUrl };
      } else if ((mode === 'Video' || mode === 'Audio') && mediaBlob) {
        const ext = mode === 'Video' ? 'webm' : 'webm';
        const url = await uploadFileToStorage(mediaBlob, 'submissions', `media.${ext}`);
        if (mode === 'Video') media = { videoUrl: url };
        else media = { audioUrl: url };
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: authorEmailVal,
          authorName: name.trim() || undefined,
          title: titleVal,
          placeLabel,
          lat: 0,
          lng: 0,
          format: apiFormat,
          text: mode === 'Texto' ? text.trim() : undefined,
          media: Object.keys(media).length ? media : undefined,
          tags: { themes: [], moods: [], keywords: [] },
          consent: { termsAccepted: true, license: 'allow_publish' },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const raw = data.error || `Error ${res.status}. Intenta de nuevo.`;
        const isTechnical = res.status >= 500 || /firebase|admin|config|env|FIREBASE_|required/i.test(String(raw));
        setErr(isTechnical ? 'No pudimos guardar tu historia. Revisa tu conexión o intenta más tarde.' : raw);
        return;
      }

      const id = data.id || imprintIdRef.current || makeId('AM');
      imprintIdRef.current = id;
      if (data.visualParams && typeof data.visualParams === 'object') visualParamsRef.current = data.visualParams as typeof visualParamsRef.current;
      setStep('received');
    } catch (e) {
      console.error('submit', e);
      setErr('No pudimos enviar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [canSubmit, mode, text, mediaBlob, imageFile, city, country, storyTitle, name, email, wantsEmail]);

  const resetForNewStory = useCallback(() => {
    setErr('');
    setStep('capture');
    imprintIdRef.current = '';
    visualParamsRef.current = null;
    setStoryTitle('');
    setText('');
    setAttachments([]);
    setAcceptedPrivacy(false);
    setWantsEmail(false);
    setEmail('');
    setName('');
    setAgeRange('');
    setSex('');
    setCity('');
    setCountry('');
    hardResetCapture();
    onClearChosenTopic();
  }, [hardResetCapture, onClearChosenTopic]);

  if (!isOpen) return null;

  const { mm, ss } = formatSeconds(secondsLeft);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden" style={{ fontFamily: APP_FONT }}>
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-8 py-6">
          <div className="min-w-0">
            <div className="text-xs font-black tracking-widest uppercase text-gray-400">ALMAMUNDI</div>
          </div>

          <button
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors active:scale-95"
            style={soft.button}
            type="button"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        {/* ERROR */}
        {err && (
          <div className="px-8 pb-2">
            <div className="p-4 rounded-3xl text-sm font-bold" style={{ ...soft.inset, color: '#C2410C' }}>
              {err}
            </div>
          </div>
        )}

        {/* BODY */}
        <div
          className={`px-8 pb-8 hide-scrollbar ${step === 'received' ? 'pt-1 overflow-hidden' : 'pt-4 overflow-y-auto'}`}
          style={{ maxHeight: err ? 'calc(90vh - 220px)' : 'calc(90vh - 190px)' }}
        >
          {/* STEP 1: CAPTURE */}
          {step === 'capture' && (
            <div className="rounded-[30px] p-7" style={soft.inset}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-sm font-black tracking-widest uppercase text-gray-500">
                  {mode === 'Texto' ? 'Escribe' : mode === 'Foto' ? 'Sube una foto' : 'Graba'} · {mode === 'Texto' ? 'Máximo 2 carillas aprox.' : mode === 'Foto' ? 'JPG o PNG' : 'Máximo 5:00'}
                </div>
                {mode !== 'Texto' && mode !== 'Foto' ? <div className="text-xs font-black tracking-widest uppercase text-gray-400">{mm}:{ss}</div> : null}
              </div>

              {mode === 'Foto' ? (
                <>
                  <div className="text-gray-600 text-sm leading-relaxed mb-4">
                    Muéstrale a las personas un instante de tu mirada.
                  </div>
                  <label className="w-full block cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-xs font-black tracking-widest uppercase text-orange-600 active:scale-95" style={soft.button}>
                      <ImageIcon size={18} />
                      Elegir foto
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (imagePreviewUrl) {
                          try {
                            URL.revokeObjectURL(imagePreviewUrl);
                          } catch {}
                        }
                        setImageFile(file);
                        setImagePreviewUrl(URL.createObjectURL(file));
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {imagePreviewUrl && (
                    <div className="mt-6 rounded-[18px] overflow-hidden bg-gray-200" style={{ maxHeight: 320 }}>
                      <img src={imagePreviewUrl} alt="Vista previa" className="w-full h-auto object-contain max-h-[320px]" />
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={!canContinueFromCapture}
                      className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-50"
                      style={{ ...soft.button, backgroundColor: '#ff4500' }}
                    >
                      Continuar
                    </button>
                  </div>
                </>
              ) : mode === 'Texto' ? (
                <>
                  {chosenTopic ? (
                    <div className="mb-4 p-4 rounded-[18px]" style={{ ...soft.flat, borderRadius: '18px' }}>
                      <div className="text-xs font-black tracking-widest uppercase text-gray-500 mb-2">Inspiración</div>
                      <div className="text-lg font-black text-gray-700">{chosenTopic.title}</div>
                      <div className="mt-2 text-sm text-gray-600">
                        {chosenTopic.questions.slice(0, 3).map((q, i) => (
                          <div key={i}>• {q}</div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={onClearChosenTopic}
                        className="mt-3 text-xs font-black tracking-widest uppercase text-gray-500 hover:text-red-500"
                      >
                        Quitar inspiración
                      </button>
                    </div>
                  ) : null}

                  <div className="text-gray-600 text-sm leading-relaxed mb-4">Escribe sin pensar demasiado. Que salga, como salga.</div>

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe aquí…"
                    className="w-full min-h-[240px] rounded-[18px] p-5 outline-none text-gray-700"
                    style={{ ...soft.flat, borderRadius: '18px' }}
                  />

                  <div className="mt-3 text-xs text-gray-500">
                    {text.length}/{MAX_TEXT} {isTextTooLong ? '· Te pasaste un poquito. Recorta y sigue ✂️' : ''}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={!canContinueFromCapture}
                      className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-50"
                      style={{ ...soft.button, backgroundColor: '#ff4500' }}
                    >
                      Continuar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    Cuando quieras, aprieta <strong>Grabar</strong>. Puedes detener cuando quieras.
                  </div>

                  {mode === 'Video' && isRecording && (
                    <div className="mt-6 h-[260px] rounded-[18px] overflow-hidden" style={soft.flat}>
                      <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3 items-center">
                    {!isRecording ? (
                      <button type="button" onClick={startRecording} className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-orange-600 active:scale-95" style={soft.button}>
                        Grabar
                      </button>
                    ) : (
                      <button type="button" onClick={stopRecording} className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-gray-700 active:scale-95" style={soft.button}>
                        Detener
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={hardResetCapture}
                      className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-gray-600 active:scale-95"
                      style={soft.button}
                      disabled={isRecording}
                    >
                      Repetir
                    </button>

                    <div className="text-xs font-black tracking-widest uppercase text-gray-400">{mm}:{ss}</div>
                  </div>

                  {mediaUrl && !isRecording && (
                    <div className="mt-6">
                      {mode === 'Video' ? (
                        <video src={mediaUrl} controls className="w-full rounded-[18px]" />
                      ) : (
                        <audio src={mediaUrl} controls className="w-full" />
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={!canContinueFromCapture}
                      className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-50"
                      style={{ ...soft.button, backgroundColor: '#ff4500' }}
                    >
                      Continuar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Completar historia */}
              <div className="rounded-[30px] p-7" style={soft.inset}>
                <div className="text-sm font-black tracking-widest uppercase text-gray-500 mb-4">Completa tu historia</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <FileText size={14} />
                      </span>
                      Título (opcional)
                    </div>
                    <input
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="Ej: El día que entendí algo"
                      className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700"
                      style={{ ...soft.flat, borderRadius: '18px' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <Upload size={14} />
                      </span>
                      Sube documentos y/o música (opcional)
                    </div>

                    <label className="w-full px-5 py-4 rounded-[18px] flex items-center justify-between cursor-pointer text-gray-600" style={{ ...soft.flat, borderRadius: '18px' }}>
                      <span className="text-sm">Seleccionar archivos</span>
                      <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                    </label>

                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachments.map((f, idx) => (
                          <div key={f.name + idx} className="flex items-center justify-between px-4 py-3 rounded-[16px]" style={{ ...soft.flat, borderRadius: '16px' }}>
                            <div className="text-sm text-gray-700 truncate">{f.name}</div>
                            <button type="button" onClick={() => removeFile(idx)} className="text-xs font-black tracking-widest uppercase text-gray-500 hover:text-red-500">
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos */}
              <div className="rounded-[30px] p-7" style={soft.inset}>
                <div className="text-sm font-black tracking-widest uppercase text-gray-500 mb-4">Datos (obligatorios)</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <Users size={14} />
                      </span>
                      Género <span className="text-orange-500" aria-hidden>*</span>
                    </div>
                    <select value={sex} onChange={(e) => setSex(e.target.value as Sex)} className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }}>
                      <option value="">Selecciona</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Hombre">Hombre</option>
                      <option value="No binario">No binario</option>
                      <option value="Otro">Otro</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <Users size={14} />
                      </span>
                      Rango de edad <span className="text-orange-500" aria-hidden>*</span>
                    </div>
                    <select value={ageRange} onChange={(e) => setAgeRange(e.target.value as AgeRange)} className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }}>
                      <option value="">Selecciona</option>
                      <option value="13-17">13-17</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45-54">45-54</option>
                      <option value="55-64">55-64</option>
                      <option value="65+">65+</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <MapPin size={14} />
                      </span>
                      Ciudad <span className="text-orange-500" aria-hidden>*</span>
                    </div>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Santiago" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} aria-required="true" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <Globe2 size={14} />
                      </span>
                      Región <span className="text-orange-500" aria-hidden>*</span>
                    </div>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej: Chile" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} aria-required="true" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <User size={14} />
                      </span>
                      Nombre (opcional)
                    </div>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cómo quieres aparecer" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} />
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <input id="wantsEmail" type="checkbox" checked={wantsEmail} onChange={(e) => setWantsEmail(e.target.checked)} className="w-5 h-5" />
                    <label htmlFor="wantsEmail" className="text-sm text-gray-600 font-bold">
                      Quiero saber por mail cuando aparezca en el mapa
                    </label>
                  </div>

                  {wantsEmail && (
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                        <span className="text-orange-500">
                          <Mail size={14} />
                        </span>
                        Mail <span className="text-orange-500" aria-hidden>*</span>
                      </div>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@mail.com" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} />
                      {email.trim().length > 0 && !isEmailLike(email) ? <div className="mt-2 text-xs font-bold text-red-600">Revisa el formato del mail.</div> : null}
                    </div>
                  )}

                  <div className="md:col-span-2 flex items-start gap-3 pt-2">
                    <input id="privacy" type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="w-5 h-5 mt-1" aria-required="true" />
                    <label htmlFor="privacy" className="text-sm text-gray-600 font-bold leading-relaxed">
                      Leí y acepto la{' '}
                      <a className="text-orange-600 underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">
                        política de privacidad
                      </a>
                      <span className="text-orange-500" aria-hidden> *</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-end">
                  <button type="button" onClick={() => setStep('capture')} className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-gray-600 active:scale-95" style={soft.button}>
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit}
                    className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-60"
                    style={{ ...soft.button, backgroundColor: '#ff4500' }}
                  >
                    {saving ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECEIVED — Todo en una pantalla sin scroll */}
          {step === 'received' && (
            <div className="flex flex-col items-center text-center pt-0 pb-2 px-2 overflow-hidden" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-orange-500 mb-0.5 flex-shrink-0" style={soft.inset}>
                <Check size={20} className="stroke-[3]" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-0 leading-tight flex-shrink-0">
                Tu <span className="text-orange-600">Huella Visual</span>
              </h2>
              <p className="text-gray-500 text-xs leading-tight mb-1 max-w-sm flex-shrink-0">
                Tu historia se ha codificado en esta impronta única.
              </p>

              <div className="w-full max-w-[360px] mx-auto flex flex-col items-center gap-1.5 flex-shrink-0">
                {String(imprintIdRef.current).startsWith('dev-') && (
                  <p className="text-[10px] text-amber-700 font-medium flex-shrink-0">Modo desarrollo.</p>
                )}
                {/* Huella cuadrada + franja fecha/URL */}
                <div className="relative w-full max-w-[260px] flex flex-col rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200/80" style={soft.flat}>
                  <div className="relative aspect-square w-full">
                    {visualParamsRef.current ? (
                      <ImprontaFromVisualParams visualParams={visualParamsRef.current} canvasId="impronta-canvas" />
                    ) : (
                      <ImprontaDataFingerprint
                        seedText={seedForImpronta + imprintIdRef.current + (storyTitle ? `-${storyTitle}` : '') + (mode ?? '')}
                        canvasId="impronta-canvas"
                      />
                    )}
                  </div>
                  <div className="min-h-[52px] w-full py-2 px-3 bg-gradient-to-t from-black/80 to-black/60 flex flex-col justify-end rounded-b-2xl pointer-events-none">
                    <p className="text-[10px] text-white/95 leading-tight">
                      Fecha de entrega: <span className="text-orange-300 font-semibold">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                    <a href="https://www.almamundi.org" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-orange-300 hover:text-orange-200 no-underline pointer-events-auto inline-block mt-0.5">
                      www.almamundi.org
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center flex-shrink-0">
                  <button type="button" onClick={downloadImpronta} className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black tracking-widest uppercase text-[10px] text-gray-600 hover:text-gray-800 active:scale-95 border-2 border-gray-400/50 bg-transparent hover:bg-gray-200/30" style={{ fontFamily: APP_FONT }}>
                    <Download size={12} />
                    Descargar Huella
                  </button>
                  <button type="button" onClick={resetForNewStory} className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black tracking-widest uppercase text-[10px] text-white hover:opacity-95 active:scale-95 bg-orange-500 hover:bg-orange-600 border-0" style={{ fontFamily: APP_FONT }}>
                    <RefreshCcw size={12} />
                    Otra Historia
                  </button>
                  <a href="#mapa" className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black tracking-widest uppercase text-[10px] text-gray-600 hover:text-gray-800 active:scale-95 border-2 border-gray-400/50 bg-transparent hover:bg-gray-200/30 no-underline" style={{ fontFamily: APP_FONT }}>
                    <MapPin size={12} />
                    Volver al Mapa
                  </a>
                </div>
                <a href="#historias" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => document.getElementById('historias')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-xs font-bold text-orange-600 hover:text-orange-700 underline underline-offset-1 flex-shrink-0">
                  Conoce otras historias
                </a>

                <div className="w-full pt-1 border-t border-gray-300/50 flex-shrink-0">
                  <p className="text-[10px] font-bold text-gray-600 mb-0.5">Comparte Alma Mundi</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <button type="button" onClick={() => shareAlmaMundi('whatsapp')} className="py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] text-white bg-[#25D366] hover:opacity-90 active:scale-95" aria-label="WhatsApp"><Share2 size={12} /></button>
                    <button type="button" onClick={() => shareAlmaMundi('facebook')} className="py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] text-white bg-[#1877F2] hover:opacity-90 active:scale-95" aria-label="Facebook"><Share2 size={12} /></button>
                    <button type="button" onClick={() => shareAlmaMundi('x')} className="py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] text-white bg-black hover:opacity-90 active:scale-95" aria-label="X"><Share2 size={12} /></button>
                    <button type="button" onClick={() => shareAlmaMundi('instagram')} className="py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] text-white bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 active:scale-95" aria-label="Instagram"><Share2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [modalMode, setModalMode] = useState<Mode | null>(null);
  const [showPurpose, setShowPurpose] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBits, setShowBits] = useState(false);
  const [chosenTopic, setChosenTopic] = useState<InspirationTopic | null>(null);

  useEffect(() => {
    const onPurpose = () => setShowPurpose(true);
    const onHowItWorks = () => setShowHowItWorks(true);
    const onOpenStoryModal = (e: Event) => {
      const mode = (e as CustomEvent<{ mode?: 'Video' | 'Audio' | 'Texto' | 'Foto' }>).detail?.mode ?? 'Texto';
      setModalMode(mode);
    };
    window.addEventListener('almamundi:voice:showPurpose', onPurpose);
    window.addEventListener('almamundi:voice:showHowItWorks', onHowItWorks);
    window.addEventListener('almamundi:openStoryModal', onOpenStoryModal);
    return () => {
      window.removeEventListener('almamundi:voice:showPurpose', onPurpose);
      window.removeEventListener('almamundi:voice:showHowItWorks', onHowItWorks);
      window.removeEventListener('almamundi:openStoryModal', onOpenStoryModal);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden relative" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
      <style jsx global>{globalStyles}</style>

      {/* MODALES */}
      <StoryModal
        isOpen={modalMode !== null}
        mode={modalMode ?? 'Video'}
        onClose={() => setModalMode(null)}
        onChooseMode={(m) => setModalMode(m)}
        chosenTopic={chosenTopic}
        onClearChosenTopic={() => setChosenTopic(null)}
      />

      <PurposeModal isOpen={showPurpose} onClose={() => setShowPurpose(false)} />

      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      <BitsModal isOpen={showBits} onClose={() => setShowBits(false)} />

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-32 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center">
          <img src="/logo.png" alt="AlmaMundi" className="h-28 md:h-36 w-auto object-contain select-none filter drop-shadow-md" />
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-bold text-gray-600 items-center">
          <button onClick={() => setShowPurpose(true)} className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button} type="button">
            Nuestro propósito
          </button>
          <button onClick={() => setShowHowItWorks(true)} className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button} type="button">
            ¿Cómo funciona?
          </button>
          <HistoriasAccordion variant="header" buttonStyle={{ ...soft.button, padding: '1rem 2rem', fontSize: '0.875rem', fontWeight: 700 }} className="[&_button]:hover:text-orange-600 [&_button]:active:scale-95" />
          <a href="#mapa" className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button}>
            Mapa
          </a>
        </nav>
      </header>

      {/* INTRO: frase visible; cards justo debajo */}
      <section id="intro" className="pt-44 md:pt-52 pb-4 md:pb-6 px-6 relative z-10 flex flex-col items-center text-center scroll-mt-28">
        <div className="max-w-6xl animate-float">
          <h1 className="text-3xl md:text-5xl font-light leading-tight mb-4" style={{ color: soft.textMain }}>
            AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que <span className="font-semibold">despiertan otras historias.</span>
          </h1>
          <div className="w-24 h-1.5 rounded-full mx-auto mb-4 bg-[var(--almamundi-orange)]" />
          <p className="text-lg md:text-2xl font-light max-w-4xl mx-auto leading-relaxed mt-8 md:mt-10" style={{ color: soft.textBody }}>
            Aquí, cada relato importa. <strong>Cada historia es extraordinaria.</strong>
          </p>
        </div>
      </section>

      {/* CARDS */}
      <section id="historias" className="w-full px-4 md:px-6 pb-6 mb-20 flex flex-col md:flex-row flex-wrap gap-y-5 gap-x-10 md:gap-x-14 justify-center items-stretch relative z-10 mt-6 md:mt-8">
        <SoftCard title="Tu historia," subtitle="en primer plano" buttonLabel="GRABA TU VIDEO" onClick={() => setModalMode('Video')} delay="0s">
          A veces, una mirada lo dice todo. Anímate a <strong>grabar ese momento que te marcó</strong>, una experiencia que viviste o que alguien más te contó.
        </SoftCard>
        <SoftCard title="Dale voz" subtitle="a tu recuerdo" buttonLabel="GRABA TU AUDIO" onClick={() => setModalMode('Audio')} delay="0.2s">
          Hay historias que se sienten mejor cuando solo se escuchan. <strong>Graba tu relato en audio</strong> y deja que tu voz haga el resto.
        </SoftCard>
        <SoftCard title="Ponle palabras" subtitle="a tu historia" buttonLabel="ESCRIBE TU HISTORIA" onClick={() => setModalMode('Texto')} delay="0.4s">
          Si lo tuyo es escribir, este es tu lugar. Tómate un respiro y <strong>cuenta tu historia a tu ritmo</strong>, palabra por palabra.
        </SoftCard>
        <SoftCard title="Tu mirada," subtitle="en una fotografía" buttonLabel="SUBE UNA FOTO" onClick={() => setModalMode('Foto')} delay="0.6s">
          A veces, una imagen guarda lo que las palabras no alcanzan.
        </SoftCard>
      </section>

      {/* Sección mapa: debajo de intro/cards; título + dock + globo */}
      <section id="mapa" className="w-full scroll-mt-28 bg-[var(--home-bg)]">
        <div className="map-section-gradient-block w-full">
          <h2 className="text-center text-[72px] md:text-[96px] leading-none py-10" style={{ color: 'var(--almamundi-orange)' }}>
            Mapa de AlmaMundi
          </h2>
          {/* Franja de funciones: aquí debajo de la frase (portal desde HomeMap). NO está en el universo. 100% neumorfismo. */}
          <div id="map-dock-slot" className="w-full px-2 md:px-3 py-4 md:py-5" />
          {/* Espacio fijo entre la barra y el globo: las palabras no tapan el mapa; el globo empieza debajo */}
          <div className="min-h-[48px] md:min-h-[64px] w-full shrink-0" aria-hidden />
              </div>
        {/* Universo: globo debajo de la barra; fondo negro al final de la sección. */}
        <div className="relative w-full min-h-[120vh] h-[120vh] flex flex-col overflow-hidden bg-[var(--universe-bg)]" style={{ minHeight: '120vh' }}>
          <HomeMap />
        </div>
      </section>

      {/* FOOTER: crece hacia abajo (más padding y título); el globo sigue con 100vh y no pierde espacio */}
      <footer className="w-full pb-32 pt-28 md:pt-36 px-8 md:px-12 flex flex-col items-center relative z-20 bg-[#E0E5EC]" style={{ fontFamily: APP_FONT }}>
        <div className="mb-20 mt-8 w-full flex justify-center select-none">
          <h1 className="text-7xl md:text-[140px] lg:text-[200px] text-center leading-none almamundi-footer-title">ALMAMUNDI</h1>
        </div>

        <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center md:items-end text-lg font-medium pt-14 pb-8 text-gray-600 gap-12">
          <div className="flex flex-col items-center md:items-start">
            <span className="block mb-4 opacity-70 text-base">Una iniciativa de</span>
            <img src="/logo-precisar.png" alt="Precisar" className="h-16 w-auto object-contain" />
          </div>

          <div className="flex flex-wrap justify-center gap-10 md:gap-12 opacity-90 items-center">
            <button onClick={() => setShowPurpose(true)} className="hover:text-gray-900 transition-colors font-bold" type="button">
              Nuestro propósito
            </button>

            <button onClick={() => setShowHowItWorks(true)} className="hover:text-gray-900 transition-colors font-bold" type="button">
              ¿Cómo funciona?
            </button>

            <HistoriasAccordion variant="footer" />
            <Link href="/archivo" className="hover:text-gray-900 transition-colors font-bold">
              Archivo
            </Link>
            <a href="#mapa" className="hover:text-gray-900 transition-colors font-bold">
              Mapa
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
