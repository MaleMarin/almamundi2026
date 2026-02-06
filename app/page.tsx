// deploy-test-2026-01-08

'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
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
  FileText
} from 'lucide-react';

// --- IMPORTACIÓN DINÁMICA DEL GLOBO (SSR OFF) ---
const GlobeComp = dynamic(() => import('react-globe.gl'), { ssr: false });

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

  @keyframes record-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
  }
  .record-pulse { animation: record-pulse 1.2s ease-in-out infinite; }

  .engraved-text {
    color: #E0E5EC;
    text-shadow: 2px 2px 5px rgba(163,177,198,0.7), -2px -2px 5px rgba(255,255,255,0.8);
  }

  /* ALMAMUNDI footer (relieve neumórfico como tu imagen) */
  .almamundi-footer-title{
    color: #E0E5EC;
    font-family: "Avenir Next", Avenir, system-ui, -apple-system, sans-serif;
    font-weight: 900;
    letter-spacing: -0.06em;
    -webkit-text-stroke: 1px rgba(163,177,198,0.60);
    text-shadow:
      -14px -14px 28px rgba(255,255,255,0.95),
       14px  14px 28px rgba(163,177,198,0.90),
       -3px  -3px  6px rgba(255,255,255,0.85),
        3px   3px  6px rgba(163,177,198,0.75);
  }
`;

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
type Mode = 'Video' | 'Audio' | 'Texto';

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
    setWidth(el.clientWidth || 900);

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

function formatTime(seconds: number) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function isEmailLike(v: string) {
  // simple, suficiente para UI (la validación real va server-side)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function pickMimeType(preferred: string[]) {
  // @ts-ignore
  const MR = typeof window !== 'undefined' ? window.MediaRecorder : undefined;
  if (!MR?.isTypeSupported) return '';
  for (const t of preferred) {
    try {
      // @ts-ignore
      if (MR.isTypeSupported(t)) return t;
    } catch {}
  }
  return '';
}

async function blobToAmplitudeSamples(blob: Blob, target = 160) {
  try {
    const arr = await blob.arrayBuffer();
    // @ts-ignore
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
function ImprontaVisualizer({
  isActive,
  seedText,
  audioBlob,
  canvasId
}: {
  isActive: boolean;
  seedText: string;
  audioBlob: Blob | null;
  canvasId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amps, setAmps] = useState<number[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!audioBlob) {
      setAmps(null);
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

      t += 0.03;

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

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [isActive, seedText, amps]);

  return <canvas id={canvasId} ref={canvasRef} width={520} height={260} className="w-full h-full object-cover opacity-90" />;
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
    <div className="absolute top-32 right-6 z-[80] pointer-events-none hidden lg:block">
      <div
        className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[26px] shadow-lg max-w-xs animate-float"
        style={{ fontFamily: APP_FONT }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
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
      className="relative p-8 rounded-[40px] flex flex-col items-start transition-all duration-500 hover:-translate-y-2 group animate-float w-full md:w-[380px] min-h-[520px]"
      style={{ ...soft.flat, animationDelay: delay, fontFamily: APP_FONT }}
    >
      <div className="mb-6">
        <h3 className="text-xl font-light text-gray-500">{title}</h3>
        <h2 className="text-3xl font-bold text-gray-700 leading-none">{subtitle}</h2>
      </div>

      <div className="flex-1" />

      <div className="w-full">
        <p className="text-gray-500 leading-relaxed text-base md:text-lg mb-6">{children}</p>

        <button
          onClick={onClick}
          className="w-full flex justify-center px-10 py-4 rounded-full text-xs font-black tracking-widest text-orange-500 uppercase transition-all active:scale-95 group-hover:text-orange-600"
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
/* MODALS                                                              */
/* ------------------------------------------------------------------ */
function PurposeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useModalUX(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-lg p-10 rounded-[40px] relative shadow-2xl animate-float" style={{ fontFamily: APP_FONT }}>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-colors active:scale-95"
          style={soft.button}
          aria-label="Cerrar"
          type="button"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-6 text-gray-700">Nuestro Propósito</h2>

        <p className="text-gray-600 leading-relaxed mb-6">
          AlmaMundi no es una red social. Es un <strong>archivo vivo</strong>. Un lugar donde lo vivido queda, y puede volver a aparecer en otras vidas.
        </p>

        <div className="p-6 rounded-3xl mb-2" style={soft.inset}>
          <p className="italic text-gray-500">“Lo que se cuenta, no se pierde.”</p>
        </div>
      </div>
    </div>
  );
}

function InspirationModal({
  isOpen,
  onClose,
  topics,
  onChoose,
  onPickPrompt
}: {
  isOpen: boolean;
  onClose: () => void;
  topics: InspirationTopic[];
  onChoose: (t: InspirationTopic) => void;
  onPickPrompt?: (promptText: string) => void;
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
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPickPrompt) {
                          onPickPrompt(q2);
                        }
                      }}
                      className="w-full text-left hover:text-orange-600 transition-colors py-1 px-1 rounded active:scale-[0.98]"
                      aria-label={`Usar pregunta: ${q2}`}
                    >
                      • {q2}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-xs font-black tracking-widest uppercase text-orange-600">Elegir tema completo</div>
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
  onClearChosenTopic,
  prefillPrompt
}: {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onChooseMode: (m: Mode) => void; // (lo dejamos para que no cambie tu API, aunque no lo mostramos dentro del modal)
  chosenTopic: InspirationTopic | null;
  onClearChosenTopic: () => void;
  prefillPrompt?: string;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [err, setErr] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errType, setErrType] = useState<'permission' | 'notfound' | 'notreadable' | 'security' | 'other' | null>(null);

  const [hasPreview, setHasPreview] = useState(false);
  const [devDiag, setDevDiag] = useState<{ secure: boolean; ua: string; v: number; a: number }>({
    secure: typeof window !== 'undefined' ? window.isSecureContext : false,
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    v: 0,
    a: 0
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const imprintIdRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const audioVisualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const keepPreviewOnStopRef = useRef<boolean>(true);

  const MAX_TEXT = 6000;
  const isTextTooLong = text.length > MAX_TEXT;

  const revokeMediaUrl = useCallback(() => {
    if (!mediaUrl) return;
    try {
      URL.revokeObjectURL(mediaUrl);
    } catch {}
  }, [mediaUrl]);

  const countTracks = useCallback((s: MediaStream | null) => {
    const v = s?.getVideoTracks?.().length ?? 0;
    const a = s?.getAudioTracks?.().length ?? 0;
    return { v, a };
  }, []);

  const updateDevDiag = useCallback(
    (s: MediaStream | null) => {
      if (typeof window === 'undefined') return;
      const { v, a } = countTracks(s);
      setDevDiag({
        secure: window.isSecureContext,
        ua: navigator.userAgent,
        v,
        a
      });
    },
    [countTracks]
  );

  const isDevMode = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

  function friendlyGetUserMediaError(e: unknown): { message: string; type: 'permission' | 'notfound' | 'notreadable' | 'security' | 'other' } {
    const err = e as { name?: string; message?: string };
    const name = String(err?.name || '');
    
    // En producción, mensajes cortos y específicos
    if (!isDevMode) {
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return { message: 'Permiso denegado. Revisa permisos del navegador y del sistema.', type: 'permission' };
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return { message: 'No se detectó cámara/micrófono.', type: 'notfound' };
      }
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        return { message: 'La cámara está en uso por otra app.', type: 'notreadable' };
      }
      if (name === 'SecurityError') {
        return { message: 'El navegador bloqueó el acceso por seguridad.', type: 'security' };
      }
      return { message: 'Activa permisos de cámara/micrófono para grabar.', type: 'other' };
    }
    
    // En desarrollo, detalles técnicos
    const message = String(err?.message || '');
    const base = `getUserMedia: ${name}${message ? ` — ${message}` : ''}`;
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return { message: `${base}\nPermiso bloqueado. En macOS: Ajustes del sistema → Privacidad y seguridad → Cámara/Micrófono → habilitar Chrome. Luego cierra y reabre Chrome.`, type: 'permission' };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return { message: `${base}\nNo se encontró cámara o micrófono disponible.`, type: 'notfound' };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return { message: `${base}\nEl dispositivo podría estar ocupado por otra app (Zoom/Meet/OBS). Cierra esa app e intenta de nuevo.`, type: 'notreadable' };
    }
    if (name === 'SecurityError') {
      return { message: `${base}\nError de seguridad. Verifica que estés en HTTPS y que el sitio tenga permisos.`, type: 'security' };
    }
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return { message: `${base}\nLa configuración solicitada (resolución/cámara) no se puede cumplir.`, type: 'other' };
    }
    return { message: `${base}\nNo se pudo acceder a cámara/micrófono. Revisa permisos.`, type: 'other' };
  }

  const stopTracks = useCallback((s: MediaStream | null) => {
    try {
      s?.getTracks?.().forEach((t) => t.stop());
    } catch {}
  }, []);

  const detachPreview = useCallback(() => {
    const v = previewVideoRef.current;
    if (!v) return;
    try {
      (v as HTMLVideoElement & { srcObject: MediaStream | null }).srcObject = null;
    } catch {}
  }, []);

  const cleanupStream = useCallback(
    (opts?: { keepPreview?: boolean }) => {
      const keep = opts?.keepPreview ?? false;
      if (keep) {
        updateDevDiag(streamRef.current);
        return;
      }
      stopTracks(streamRef.current);
      streamRef.current = null;
      detachPreview();
      setHasPreview(false);
      updateDevDiag(null);
    },
    [detachPreview, stopTracks, updateDevDiag]
  );

  const ensurePreviewAttached = useCallback(() => {
    if (mode !== 'Video') return;
    const v = previewVideoRef.current;
    const s = streamRef.current;
    if (!v || !s) return;
    const vEl = v as HTMLVideoElement & { srcObject: MediaStream | null };
    if (!vEl.srcObject) {
      try {
        v.muted = true;
        v.playsInline = true;
        v.setAttribute('playsinline', 'true');
        vEl.srcObject = s;
        v.play().catch(() => {});
      } catch {}
    }
  }, [mode]);

  const streamIsLive = useCallback((s: MediaStream | null) => {
    if (!s) return false;
    try {
      const tracks = s.getTracks();
      if (!tracks.length) return false;
      return tracks.every((t) => t.readyState === 'live');
    } catch {
      return false;
    }
  }, []);

  const startPreview = useCallback(async () => {
    setErr('');
    setErrType(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErr('Este navegador no permite grabar. Prueba en Chrome o Safari actualizado.');
      setErrType('other');
      return;
    }
    if (streamIsLive(streamRef.current)) {
      setHasPreview(true);
      ensurePreviewAttached();
      updateDevDiag(streamRef.current);
      return;
    }
    try {
      const constraints: MediaStreamConstraints =
        mode === 'Video' ? { video: true, audio: false } : mode === 'Audio' ? { audio: true } : {};
      if (!('video' in constraints) && !('audio' in constraints)) return;

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPreview(true);

      if (mode === 'Video') {
        const video = previewVideoRef.current;
        if (video) {
          video.muted = true;
          video.playsInline = true;
          video.setAttribute('playsinline', 'true');
          (video as HTMLVideoElement & { srcObject: MediaStream | null }).srcObject = stream;
          try {
            await video.play();
          } catch (e) {
            console.error('preview video.play failed', e);
            setErr('No se pudo reproducir la vista previa de cámara. Revisa permisos o bloqueos de autoplay.');
            setHasPreview(false);
            updateDevDiag(null);
            return;
          }
        }
      }
      updateDevDiag(stream);
    } catch (e: unknown) {
      console.error('[getUserMedia][preview]', e);
      setHasPreview(false);
      const errorInfo = friendlyGetUserMediaError(e);
      setErr(errorInfo.message);
      setErrType(errorInfo.type);
      updateDevDiag(null);
    }
  }, [ensurePreviewAttached, mode, streamIsLive, updateDevDiag]);

  const stopPreview = useCallback(() => {
    cleanupStream({ keepPreview: false });
  }, [cleanupStream]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    try {
      recorderRef.current?.stop();
    } catch {}
  }, []);

  const hardResetCapture = useCallback(() => {
    setErr('');
    setErrType(null);
    setSecondsLeft(300);
    chunksRef.current = [];

    if (isRecording) {
      try {
        recorderRef.current?.stop();
      } catch {}
      recorderRef.current = null;
      return;
    }

    recorderRef.current = null;
    setMediaBlob(null);
    revokeMediaUrl();
    setMediaUrl('');
    // Detener tracks y limpiar preview al repetir
    cleanupStream({ keepPreview: false });
  }, [cleanupStream, revokeMediaUrl, isRecording]);

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
    setMediaBlob(null);
    revokeMediaUrl();
    setMediaUrl('');
    setIsRecording(false);
    setSecondsLeft(300);
    setErr('');
    setErrType(null);
    setHasPreview(false);

    cleanupStream({ keepPreview: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Stop everything when modal closes
  useEffect(() => {
    if (isOpen) return;
    cleanupStream({ keepPreview: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Prefill from inspiration o prompt específico
  useEffect(() => {
    if (!isOpen) return;
    
    // Si hay un prompt específico, usarlo (tiene prioridad)
    if (prefillPrompt && mode === 'Texto') {
      setText((prev) => {
        // Solo pre-rellenar si el campo está vacío
        if (prev.trim().length === 0) {
          return `${prefillPrompt}\n\n`;
        }
        return prev;
      });
      // Auto-focus en el textarea cuando hay prefill
      setTimeout(() => {
        textareaRef.current?.focus();
        // Mover cursor al final del texto
        if (textareaRef.current) {
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 100);
      return;
    }
    
    // Si hay un tema completo elegido, usar ese (solo en modo Texto)
    if (mode === 'Texto' && chosenTopic) {
      setStoryTitle((prev) => (prev.trim().length ? prev : chosenTopic.title));
      const guide = chosenTopic.questions.map((q) => `• ${q}`).join('\n');
      setText((prev) => {
        // Solo pre-rellenar si el campo está vacío
        if (prev.trim().length === 0) {
          return `${guide}\n\n`;
        }
        return prev;
      });
      // Auto-focus en el textarea cuando hay tema completo
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, mode, chosenTopic, prefillPrompt]);

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

  // Audio visualizer: live feedback while recording (AnalyserNode + requestAnimationFrame)
  useEffect(() => {
    if (!isRecording || mode !== 'Audio') {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      return;
    }

    const stream = streamRef.current;
    const canvas = audioVisualizerCanvasRef.current;
    if (!stream || !canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      rafIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = 'rgb(17, 24, 39)';
      ctx.fillRect(0, 0, w, h);

      const barCount = Math.min(64, Math.floor(w / 6));
      const barWidth = (w / barCount) * 0.6;
      const gap = w / barCount - barWidth;

      for (let i = 0; i < barCount; i++) {
        const v = dataArray[Math.floor((i / barCount) * dataArray.length)] ?? 0;
        const barHeight = Math.max(4, (v / 255) * h * 0.7);
        const x = i * (w / barCount) + gap / 2;
        const y = h - barHeight;

        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, '#F97316');
        gradient.addColorStop(0.6, '#FB923C');
        gradient.addColorStop(1, '#FDBA74');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      audioContext.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [isRecording, mode]);

  const startRecording = useCallback(async () => {
    setErr('');
    setErrType(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErr('Este navegador no permite grabar. Prueba en Chrome o Safari actualizado.');
      setErrType('other');
      return;
    }

    setMediaBlob(null);
    revokeMediaUrl();
    setMediaUrl('');
    chunksRef.current = [];

    try {
      let stream: MediaStream | null = streamRef.current;
      if (!streamIsLive(stream)) stream = null;

      if (!stream) {
        if (mode === 'Audio') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: true
            });
          } catch (e1: unknown) {
            console.error('[getUserMedia][video+audio]', e1);
            const name1 = String((e1 as { name?: string })?.name || '');
            if (name1 === 'OverconstrainedError' || name1 === 'ConstraintNotSatisfiedError') {
              try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              } catch (e2: unknown) {
                console.error('[getUserMedia][video:true+audio:true]', e2);
                try {
                  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                  setErr('⚠️ No pudimos activar el micrófono. Grabaremos video sin audio.');
                } catch (e3: unknown) {
                  console.error('[getUserMedia][video:true+audio:false]', e3);
                  const errorInfo = friendlyGetUserMediaError(e3);
                  setErr(errorInfo.message);
                  setErrType(errorInfo.type);
                  return;
                }
              }
            } else {
              try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setErr('⚠️ No pudimos activar el micrófono. Grabaremos video sin audio.');
              } catch (e2: unknown) {
                console.error('[getUserMedia][video+audio fallback]', e2);
                const errorInfo = friendlyGetUserMediaError(e2);
                setErr(errorInfo.message);
                setErrType(errorInfo.type);
                return;
              }
            }
          }
        }
        streamRef.current = stream;
      }

      if (!stream) {
        setErr('No se pudo obtener stream de medios.');
        return;
      }

      updateDevDiag(streamRef.current);

      if (mode === 'Video') {
        const video = previewVideoRef.current;
        if (video) {
          video.muted = true;
          video.playsInline = true;
          video.setAttribute('playsinline', 'true');
          (video as HTMLVideoElement & { srcObject: MediaStream | null }).srcObject = streamRef.current;
          video.play().catch(() => {});
        }
        setHasPreview(true);
      } else if (mode === 'Audio') {
        setHasPreview(true);
      }

      const mimeType =
        mode === 'Audio'
          ? pickMimeType(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'])
          : pickMimeType(['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']);

      const rec = new MediaRecorder(streamRef.current!, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;

      keepPreviewOnStopRef.current = mode === 'Video';
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
          cleanupStream({ keepPreview: keepPreviewOnStopRef.current });
        }
      };

      setSecondsLeft(300);
      setIsRecording(true);
      rec.start(250);
    } catch (e: unknown) {
      console.error('[getUserMedia][record]', e);
      setIsRecording(false);
      setHasPreview(false);
      const errorInfo = friendlyGetUserMediaError(e);
      setErr(errorInfo.message);
      setErrType(errorInfo.type);
      cleanupStream({ keepPreview: false });
    }
  }, [cleanupStream, mode, revokeMediaUrl, streamIsLive, updateDevDiag]);

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
    return !!mediaBlob && !isRecording;
  }, [mode, text, isTextTooLong, mediaBlob, isRecording]);

  const canSubmit = useMemo(() => {
    const baseOk = !!sex && !!ageRange && city.trim().length > 1 && country.trim().length > 1 && acceptedPrivacy;
    const emailOk = !wantsEmail || isEmailLike(email);
    return baseOk && emailOk && !saving;
  }, [sex, ageRange, city, country, acceptedPrivacy, wantsEmail, email, saving]);

  const missingSubmitChecklist = useMemo(() => {
    const list: string[] = [];
    if (!sex) list.push('género');
    if (!ageRange) list.push('rango de edad');
    if (city.trim().length <= 1) list.push('ciudad');
    if (country.trim().length <= 1) list.push('país');
    if (!acceptedPrivacy) list.push('aceptar política de privacidad');
    if (wantsEmail && !isEmailLike(email)) list.push('mail válido');
    return list;
  }, [sex, ageRange, city, country, acceptedPrivacy, wantsEmail, email]);

  const captureChecklistText = useMemo(() => {
    // Nunca mostrar "Te falta..." mientras se está grabando o si ya hay grabación
    if (isRecording || mediaBlob) return null;
    
    if (mode === 'Texto') {
      if (isTextTooLong) return 'Te falta: recortar el texto (máx. 6000 caracteres).';
      if (text.trim().length < 30) return `Te falta: ${30 - text.trim().length} caracteres más (mín. 30).`;
      return null;
    }
    if (!mediaBlob) return 'Te falta: grabar y detener para tener una grabación.';
    return null;
  }, [mode, text, isTextTooLong, mediaBlob, isRecording]);

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
      const missing = missingSubmitChecklist;
      setErr(missing.length ? `Para enviar te falta: ${missing.join(', ')}.` : 'Completa los datos obligatorios.');
      window.setTimeout(() => setErr(''), 4000);
      return;
    }

    if (mode === 'Texto' && text.trim().length < 30) {
      setErr('Escribe un poquito más (mínimo 30 caracteres).');
      window.setTimeout(() => setErr(''), 2200);
      return;
    }
    if (mode !== 'Texto' && !mediaBlob) {
      setErr('Primero graba y detén para tener una grabación.');
      window.setTimeout(() => setErr(''), 2200);
      return;
    }

    setSaving(true);

    try {
      await sleep(900);

      const id = imprintIdRef.current || makeId('AM');
      imprintIdRef.current = id;

      setStep('received');
    } catch {
      setErr('No pudimos enviar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [canSubmit, missingSubmitChecklist, mode, text, mediaBlob]);

  const resetForNewStory = useCallback(() => {
    setErr('');
    setStep('capture');
    imprintIdRef.current = '';
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
    cleanupStream({ keepPreview: false });
  }, [cleanupStream, hardResetCapture, onClearChosenTopic]);

  if (!isOpen) return null;

  const { mm, ss } = formatSeconds(secondsLeft);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md">
      <div className="bg-[#E0E5EC] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden" style={{ fontFamily: APP_FONT }}>
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-8 py-6">
          <div className="min-w-0">
            <div className="text-xs font-black tracking-widest uppercase text-gray-400">ALMAMUNDI</div>
            <div className="text-xl font-bold text-gray-700">
              Cuenta tu historia · <span className="text-orange-600">{mode}</span>
            </div>
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
          <div className="px-8 pb-2" role="alert" aria-live="assertive">
            <div className="p-4 rounded-3xl text-sm font-bold whitespace-pre-line" style={{ ...soft.inset, color: '#C2410C' }}>
              {err}
            </div>
            {isDevMode && (
              <div className="mt-2 p-3 rounded-2xl text-[11px] text-gray-600 whitespace-pre-wrap" style={{ ...soft.flat, borderRadius: '18px' }}>
                <div className="font-black tracking-widest uppercase text-gray-500 mb-1">Diagnóstico (dev)</div>
                <div>secureContext: {String(devDiag.secure)}</div>
                <div>tracks: video={devDiag.v} audio={devDiag.a}</div>
                <div className="mt-1 opacity-70 break-all">{devDiag.ua}</div>
              </div>
            )}
            {errType === 'permission' && (
              <div className="mt-3 p-5 rounded-2xl" style={{ ...soft.flat, borderRadius: '18px' }}>
                <div className="text-xs font-black tracking-widest uppercase text-gray-600 mb-3">Cómo habilitar permisos</div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <div className="font-bold mb-1">Chrome desktop:</div>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Abrir <code className="bg-gray-200 px-1 rounded">chrome://settings/content/camera</code> y permitir</li>
                      <li>En la URL del sitio → icono de permisos (si aparece)</li>
                      <li>Recargar la página</li>
                    </ol>
                  </div>
                  <div>
                    <div className="font-bold mb-1">macOS:</div>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Ajustes del sistema → Privacidad y seguridad → Cámara / Micrófono</li>
                      <li>Habilitar Chrome</li>
                      <li>Cerrar y reabrir Chrome</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BODY */}
        <div className="px-8 pb-8 pt-4 overflow-y-auto hide-scrollbar" style={{ maxHeight: err ? 'calc(90vh - 220px)' : 'calc(90vh - 190px)' }}>
          {/* STEP 1: CAPTURE */}
          {step === 'capture' && (
            <div className="rounded-[30px] p-7" style={soft.inset}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-sm font-black tracking-widest uppercase text-gray-500">
                  {mode === 'Texto' ? 'Escribe' : 'Graba'} · Máximo {mode === 'Texto' ? '2 carillas aprox.' : '5:00'}
                </div>
                {mode !== 'Texto' ? <div className="text-xs font-black tracking-widest uppercase text-gray-400">{mm}:{ss}</div> : null}
              </div>

              {mode === 'Texto' ? (
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
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe aquí…"
                    className="w-full min-h-[240px] rounded-[18px] p-5 outline-none text-gray-700"
                    style={{ ...soft.flat, borderRadius: '18px' }}
                    aria-label="Escribe tu historia"
                    aria-describedby="text-char-count"
                  />

                  <div id="text-char-count" className="mt-3 text-xs text-gray-500" role="status" aria-live="polite">
                    {text.length}/{MAX_TEXT}
                    {isTextTooLong && <span className="text-orange-600 font-bold ml-2">· Te pasaste un poquito. Recorta y sigue ✂️</span>}
                    {!isTextTooLong && text.trim().length < 30 && (
                      <span className="text-orange-600 font-bold ml-2">· Te faltan {30 - text.trim().length} para continuar</span>
                    )}
                    {!isTextTooLong && text.trim().length >= 30 && <span className="text-green-600 font-bold ml-2">· Listo para continuar</span>}
                  </div>

                  <div className="mt-6 flex flex-col items-end gap-2">
                    {!canContinueFromCapture && captureChecklistText && (
                      <p className="text-sm font-bold text-orange-700 w-full rounded-[18px] px-4 py-3" style={soft.inset} role="status" aria-live="polite">
                        {captureChecklistText}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={!canContinueFromCapture}
                      className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:grayscale disabled:saturate-50"
                      style={{ ...soft.button, backgroundColor: '#F97316' }}
                      aria-label={canContinueFromCapture ? 'Continuar al siguiente paso' : captureChecklistText ?? 'Completa los requisitos para continuar'}
                    >
                      Continuar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    Primero <strong>activa</strong> tu {mode === 'Video' ? 'cámara' : 'micrófono'}, luego aprieta <strong>Grabar</strong>.
                  </div>

                  {/* VIDEO AREA - Solo un video visible según el estado */}
                  <div className="mt-6">
                    {/* PREVIEW: mostrar cuando se está grabando O cuando hay preview activo */}
                    {(isRecording || hasPreview) && (
                      <div
                        className={`w-full rounded-[26px] overflow-hidden bg-black/20 border-2 shadow-[0_16px_44px_rgba(20,30,60,0.16)] relative ${isRecording ? 'record-pulse border-red-500' : 'border-white/35'}`}
                        role="region"
                        aria-label={mode === 'Video' ? (isRecording ? 'Vista previa de cámara en vivo mientras grabas' : 'Vista previa de cámara') : isRecording ? 'Visualización de audio en vivo' : 'Área de grabación de audio'}
                      >
                        {mode === 'Video' ? (
                          <video
                            ref={previewVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full aspect-video object-cover bg-black"
                            aria-label={isRecording ? 'Vista previa de cámara en vivo mientras grabas' : 'Vista previa de cámara'}
                          />
                        ) : (
                          <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                            <canvas
                              ref={audioVisualizerCanvasRef}
                              className="w-full h-full object-cover"
                              style={{ aspectRatio: '16/9', display: isRecording ? 'block' : 'none' }}
                              aria-hidden="true"
                            />
                            {isRecording && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-white/90 text-base font-bold drop-shadow-lg">Te escucho</span>
                              </div>
                            )}
                            {!isRecording && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
                                <div className="text-sm font-medium">{hasPreview ? 'Micrófono listo' : 'Activa el micrófono para empezar'}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {isRecording && (
                          <>
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2" role="status" aria-live="polite" aria-label={`Grabando, ${formatTime(300 - secondsLeft)} transcurridos`}>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-600/95 backdrop-blur-md border-2 border-red-400 shadow-lg">
                                <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
                                <span className="text-xs tracking-[0.2em] uppercase text-white font-black">GRABANDO</span>
                                <span className="text-sm font-mono text-white font-bold tabular-nums">{formatTime(300 - secondsLeft)}</span>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40" aria-hidden="true">
                              <div
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ width: `${((300 - secondsLeft) / 300) * 100}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* PLAYBACK: mostrar cuando hay grabación completada y NO se está grabando y NO hay preview */}
                    {mediaUrl && !isRecording && !hasPreview && (
                      <div>
                        {mode === 'Video' ? (
                          <video src={mediaUrl} controls className="w-full rounded-[18px]" />
                        ) : (
                          <div className="rounded-[26px] p-6" style={soft.inset} role="region" aria-label="Grabación lista para escuchar">
                            <div className="text-sm font-black tracking-widest uppercase text-gray-500 mb-4">Listo para escuchar</div>
                            <div className="flex flex-wrap items-center gap-4">
                              <button
                                type="button"
                                onClick={() => {
                                  const a = document.querySelector<HTMLAudioElement>('[data-replay-audio]');
                                  a?.play().catch(() => {});
                                }}
                                className="w-14 h-14 rounded-full flex items-center justify-center text-orange-600 hover:bg-orange-500/20 active:scale-95 transition-transform"
                                style={soft.button}
                                aria-label="Reproducir grabación"
                              >
                                <Volume2 size={28} />
                              </button>
                              <audio data-replay-audio src={mediaUrl} controls className="flex-1 min-w-0" aria-label="Reproducir grabación" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PLACEHOLDER: mostrar cuando NO hay preview, NO se está grabando y NO hay grabación */}
                    {!hasPreview && !isRecording && !mediaUrl && (
                      <div className="w-full aspect-video rounded-[26px] overflow-hidden bg-black/20 border-2 border-white/35 shadow-[0_16px_44px_rgba(20,30,60,0.16)] flex items-center justify-center">
                        <div className="text-white/50 text-sm font-medium">
                          {mode === 'Video' ? 'Activa la cámara para empezar' : 'Activa el micrófono para empezar'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 items-center" role="group" aria-label="Controles de grabación">
                    {isRecording ? (
                      // Durante grabación: solo mostrar DETENER (grabación)
                      <>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-gray-700 active:scale-95"
                          style={soft.button}
                          aria-label="Detener grabación"
                        >
                          DETENER
                        </button>
                        <div className="text-xs font-black tracking-widest uppercase text-gray-400" aria-live="polite">{mm}:{ss}</div>
                      </>
                    ) : (
                      // Cuando NO se está grabando: mostrar controles según estado
                      <>
                        {!hasPreview ? (
                          <button
                            type="button"
                            onClick={startPreview}
                            className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-gray-700 active:scale-95"
                            style={soft.button}
                            aria-label={mode === 'Video' ? 'Activar cámara' : 'Activar micrófono'}
                          >
                            {mode === 'Video' ? 'ACTIVAR CÁMARA' : 'ACTIVAR MICRÓFONO'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={stopPreview}
                              className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-gray-600 active:scale-95"
                              style={soft.button}
                              aria-label={mode === 'Video' ? 'Detener cámara' : 'Detener micrófono'}
                            >
                              DETENER {mode === 'Video' ? 'CÁMARA' : 'MIC'}
                            </button>
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:saturate-50"
                              style={soft.button}
                              disabled={!hasPreview}
                              aria-label="Iniciar grabación"
                            >
                              GRABAR
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={hardResetCapture}
                          className="px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase text-gray-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:saturate-50"
                          style={soft.button}
                          disabled={isRecording}
                          aria-label="Repetir grabación"
                        >
                          REPETIR
                        </button>
                        <div className="text-xs font-black tracking-widest uppercase text-gray-400" aria-live="polite">{mm}:{ss}</div>
                      </>
                    )}
                  </div>


                  <div className="mt-6 flex flex-col items-end gap-2">
                    {!canContinueFromCapture && captureChecklistText && (
                      <p className="text-sm font-bold text-orange-700 w-full rounded-[18px] px-4 py-3" style={soft.inset} role="status" aria-live="polite">
                        {captureChecklistText}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={!canContinueFromCapture}
                      className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:grayscale disabled:saturate-50"
                      style={{ ...soft.button, backgroundColor: '#F97316' }}
                      aria-label={canContinueFromCapture ? 'Continuar al siguiente paso' : captureChecklistText ?? 'Completa la grabación para continuar'}
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
                      Género
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
                      Rango de edad
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
                      Ciudad
                    </div>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Santiago" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 mb-2">
                      <span className="text-orange-500">
                        <Globe2 size={14} />
                      </span>
                      País
                    </div>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej: Chile" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} />
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
                        Mail
                      </div>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@mail.com" className="w-full px-5 py-4 rounded-[18px] outline-none text-gray-700" style={{ ...soft.flat, borderRadius: '18px' }} />
                      {email.trim().length > 0 && !isEmailLike(email) ? <div className="mt-2 text-xs font-bold text-red-600">Revisa el formato del mail.</div> : null}
                    </div>
                  )}

                  <div className="md:col-span-2 flex items-start gap-3 pt-2">
                    <input id="privacy" type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="w-5 h-5 mt-1" />
                    <label htmlFor="privacy" className="text-sm text-gray-600 font-bold leading-relaxed">
                      Leí y acepto la{' '}
                      <a className="text-orange-600 underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">
                        política de privacidad
                      </a>
                      .
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-end gap-3">
                  {!canSubmit && missingSubmitChecklist.length > 0 && (
                    <p className="text-sm font-bold text-orange-700 w-full rounded-[18px] px-4 py-3" style={soft.inset} role="status" aria-live="polite">
                      Te falta: {missingSubmitChecklist.join(', ')}.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button type="button" onClick={() => setStep('capture')} className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-gray-600 active:scale-95" style={soft.button}>
                      Volver
                    </button>

                    <button
                      type="button"
                      onClick={submit}
                      disabled={!canSubmit}
                      className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:grayscale disabled:saturate-50"
                      style={{ ...soft.button, backgroundColor: '#F97316' }}
                      aria-label={saving ? 'Enviando formulario' : canSubmit ? 'Enviar historia' : `Te falta: ${missingSubmitChecklist.join(', ')}`}
                    >
                      {saving ? 'Enviando…' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECEIVED */}
          {step === 'received' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-orange-500 mb-4" style={soft.inset}>
                <Check size={40} className="stroke-[3]" />
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
                Gracias. Tu historia ya dejó una <span className="text-orange-600">Impronta</span>.
              </h2>

              <p className="text-gray-500 text-lg leading-relaxed mb-7 max-w-xl">
                Lo vivido queda guardado y listo para <strong>conectar</strong> con otras historias.
              </p>

              <div className="w-full max-w-2xl space-y-4 mb-8">
                <div className="p-6 rounded-[28px] text-left" style={soft.inset}>
                  <div className="text-xs font-black tracking-widest uppercase text-gray-500 mb-2">ID / Impronta</div>
                  <div className="text-2xl font-black text-gray-700">{imprintIdRef.current}</div>
                  <div className="text-sm text-gray-500 mt-2">Guárdalo si quieres volver a esta historia.</div>
                </div>

                <div className="h-[220px] rounded-[28px] overflow-hidden" style={soft.flat}>
                  <ImprontaVisualizer
                    isActive={true}
                    seedText={seedForImpronta + imprintIdRef.current + (storyTitle ? `-${storyTitle}` : '')}
                    audioBlob={mode === 'Audio' ? mediaBlob : null}
                    canvasId="impronta-canvas"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button type="button" onClick={downloadImpronta} className="py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest uppercase text-xs text-gray-600 hover:text-gray-800 active:scale-95" style={soft.button}>
                    <Download size={16} />
                    Descargar
                  </button>

                  <button type="button" onClick={() => openShare('copy')} className="py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest uppercase text-xs text-gray-600 hover:text-gray-800 active:scale-95" style={soft.button}>
                    <Share2 size={16} />
                    Copiar link
                  </button>

                  <button type="button" onClick={resetForNewStory} className="py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest uppercase text-xs text-gray-600 hover:text-gray-800 active:scale-95" style={soft.button}>
                    <RefreshCcw size={16} />
                    Otra historia
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                }}
                className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-orange-600 hover:text-orange-700 active:scale-95"
                style={soft.button}
                type="button"
              >
                Volver al mapa
              </button>
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

  const [showInspiration, setShowInspiration] = useState(false);
  const [chosenTopic, setChosenTopic] = useState<InspirationTopic | null>(null);
  const [prefillPrompt, setPrefillPrompt] = useState<string>('');

  // Función centralizada para iniciar historia desde un prompt/pregunta
  // Ir al selector de 3 formatos (Video/Audio/Texto) sin abrir el modal
  const goToStoryFormats = useCallback(() => {
    requestAnimationFrame(() => {
      document.getElementById('cuenta-tu-historia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Al elegir una pregunta concreta: guardar prompt, cerrar Inspiración, ir al selector (no abrir modal)
  const startStoryFromPrompt = useCallback((promptText: string) => {
    setPrefillPrompt(promptText);
    setChosenTopic(null); // una sola pregunta, no tema completo
    setShowInspiration(false);
    goToStoryFormats();
  }, [goToStoryFormats]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const globeEl = useRef<any>(null);
  const { ref: globeWrapRef, width: globeWrapWidth } = useElementWidth<HTMLDivElement>();
  const globeSize = Math.min(1100, Math.max(360, globeWrapWidth));

  const [isInteractive, setIsInteractive] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);

  const stories: StoryPoint[] = useMemo(
    () => [
      { lat: -33.4489, lng: -70.6693, label: 'Santiago' },
      { lat: 40.7128, lng: -74.006, label: 'New York' },
      { lat: 48.8566, lng: 2.3522, label: 'Paris' },
      { lat: 35.6762, lng: 139.6503, label: 'Tokyo' }
    ],
    []
  );

  const [newsRings, setNewsRings] = useState<NewsRing[]>([]);
  useEffect(() => {
    const id = window.setInterval(() => {
      const r: NewsRing = {
        lat: (Math.random() - 0.5) * 160,
        lng: (Math.random() - 0.5) * 360,
        maxR: Math.random() * 20 + 3,
        propagationSpeed: (Math.random() - 0.5) * 20 + 1,
        repeatPeriod: Math.random() * 2000 + 200
      };

      setNewsRings((prev) => {
        const next = [...prev, r];
        if (next.length > 15) next.shift();
        return next;
      });
    }, 1500);

    return () => window.clearInterval(id);
  }, []);

  const toggleAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;

    if (isMuted) {
      a.volume = 0.6;
      a.play().catch(() => {});
      setIsMuted(false);
    } else {
      a.pause();
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleGlobeReady = useCallback(() => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
  }, []);

  useEffect(() => {
    if (!isAutoPilot || !globeEl.current) return;

    const destinations = [
      { lat: -33.4489, lng: -70.6693, altitude: 1.8 },
      { lat: 48.8566, lng: 2.3522, altitude: 1.8 },
      { lat: 35.6762, lng: 139.6503, altitude: 1.8 },
      { lat: 40.7128, lng: -74.006, altitude: 1.8 }
    ];

    let i = 0;
    const move = () => {
      globeEl.current.pointOfView(destinations[i], 4000);
      i = (i + 1) % destinations.length;
    };

    move();
    const id = window.setInterval(move, 6000);
    return () => window.clearInterval(id);
  }, [isAutoPilot]);

  return (
    <main
      className="min-h-screen overflow-x-hidden relative"
      style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}
    >
        {/* capa “seguridad” anti-overlay: nada encima captura clicks */}
        <div className="relative z-10 pointer-events-auto">
          <style>{globalStyles}</style>
    
        <audio ref={audioRef} loop src="/universo.mp3" />

        {/* MODALES */}
        <StoryModal
          isOpen={modalMode !== null}
          mode={modalMode ?? 'Video'}
          onClose={() => {
            setModalMode(null);
            setPrefillPrompt('');
          }}
          onChooseMode={(m) => setModalMode(m)}
          chosenTopic={chosenTopic}
          onClearChosenTopic={() => setChosenTopic(null)}
          prefillPrompt={prefillPrompt}
        />

        <PurposeModal isOpen={showPurpose} onClose={() => setShowPurpose(false)} />

        <InspirationModal
          isOpen={showInspiration}
          onClose={() => setShowInspiration(false)}
          topics={INSPIRATION_TOPICS}
          onChoose={(t) => {
            setChosenTopic(t);
            setPrefillPrompt(''); // tema completo se usa vía chosenTopic
            setShowInspiration(false);
            setModalMode(null);
            goToStoryFormats();
          }}
          onPickPrompt={startStoryFromPrompt}
        />

        {/* HEADER */}
        <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-32 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20">
          <div className="flex items-center">
            <img src="/logo.png" alt="AlmaMundi" className="h-28 md:h-36 w-auto object-contain select-none filter drop-shadow-md" />
          </div>

          <nav className="hidden md:flex gap-6 text-sm font-bold text-gray-600 items-center">
            <button onClick={() => setShowPurpose(true)} className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button} type="button">
              Propósito
            </button>

            <button onClick={() => setShowInspiration(true)} className="px-8 py-4 active:scale-95 hover:text-gray-700 flex items-center gap-2" style={soft.button} type="button">
              Inspiración
            </button>

            <a href="#cuenta-tu-historia" className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button}>
              Historias
            </a>
            <a href="#mapa" className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button}>
              Mapa
            </a>
          </nav>
        </header>

        {/* INTRO */}
        <section id="intro" className="pt-48 md:pt-64 pb-4 px-6 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-6xl animate-float">
            <h1 className="text-4xl md:text-6xl font-light leading-tight mb-10" style={{ color: soft.textMain }}>
              AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que <span className="font-semibold">despiertan otras historias.</span>
            </h1>

            <div className="w-32 h-2 rounded-full mx-auto mb-12 opacity-50 bg-orange-400" />

            <p className="text-xl md:text-3xl font-light max-w-4xl mx-auto leading-relaxed" style={{ color: soft.textBody }}>
              Aquí, cada relato importa. <strong>Cada historia es extraordinaria.</strong>
            </p>

            <ChevronDown className="mx-auto mt-12 text-gray-400 opacity-50 animate-bounce" />
          </div>
        </section>

        {/* CARDS - Selector de 3 formatos (Video / Audio / Texto) */}
        <section id="cuenta-tu-historia" className="w-full px-6 mb-28 flex flex-col md:flex-row gap-12 justify-center items-stretch relative z-10 -mt-12 scroll-mt-28">
          <SoftCard title="Tu historia," subtitle="en primer plano" buttonLabel="GRABA TU VIDEO" onClick={() => setModalMode('Video')} delay="0s">
            A veces, una mirada lo dice todo. Anímate a <strong>grabar ese momento que te marcó</strong>, una experiencia que viviste o que alguien más te contó.
          </SoftCard>

          <SoftCard title="Dale voz" subtitle="a tu recuerdo" buttonLabel="GRABA TU AUDIO" onClick={() => setModalMode('Audio')} delay="0.2s">
            Hay historias que se sienten mejor cuando solo se escuchan. <strong>Graba tu relato en audio</strong> y deja que tu voz haga el resto.
          </SoftCard>

          <SoftCard title="Ponle palabras" subtitle="a tu historia" buttonLabel="ESCRIBE TU HISTORIA" onClick={() => setModalMode('Texto')} delay="0.4s">
            Si lo tuyo es escribir, este es tu lugar. Tómate un respiro y <strong>cuenta tu historia a tu ritmo</strong>, palabra por palabra.
          </SoftCard>
        </section>

        {/* MAPA */}
        <section
          id="mapa"
          className="relative w-full scroll-mt-[160px] min-h-[90vh] md:min-h-[1400px] flex flex-col justify-start overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #E0E5EC 0%, #1B2333 20%, #0F1A2B 100%)' }}
        >
        <div className="relative z-20 container mx-auto px-6 pt-16 md:pt-28 pb-10 flex flex-col items-center text-center">
          <h2 className="text-6xl md:text-8xl font-light mb-8 drop-shadow-xl" style={{ color: '#F97316' }}>
            Mapa de AlmaMundi
          </h2>

          <p className="text-gray-300 text-xl max-w-2xl font-light leading-relaxed mb-12">
            Un tejido vivo de memoria humana.
            <br />
            Cuando miles compartan, este mundo brillará.
          </p>

          <div className="inline-flex flex-wrap justify-center gap-6 md:gap-10 p-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <button
              onClick={() => setIsInteractive((v) => !v)}
              className={`flex items-center gap-3 transition-colors ${isInteractive ? 'text-orange-400' : 'text-gray-300 hover:text-white'}`}
              type="button"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInteractive ? 'bg-orange-500/20' : 'bg-white/10'}`}>
                {isInteractive ? <Unlock size={16} /> : <Lock size={16} />}
              </div>
              <span className="text-xs uppercase tracking-widest font-bold">{isInteractive ? 'Bloquear' : 'Activar'}</span>
            </button>

            <div className="w-px h-8 bg-white/10" />

            <button
              onClick={() => setIsAutoPilot((v) => !v)}
              className={`flex items-center gap-3 transition-colors ${isAutoPilot ? 'text-orange-400' : 'text-gray-300 hover:text-white'}`}
              type="button"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAutoPilot ? 'bg-orange-500/20 animate-spin-slow' : 'bg-purple-500/20 text-purple-400'}`}>
                <RotateCcw size={16} className={isAutoPilot ? 'animate-spin' : ''} />
              </div>
              <span className="text-xs uppercase tracking-widest font-bold">{isAutoPilot ? 'Detener' : 'Tour'}</span>
            </button>

            <div className="w-px h-8 bg-white/10" />

            <button onClick={toggleAudio} className="flex items-center gap-3 hover:opacity-80 transition-opacity" type="button">
              <div className={`w-8 h-8 rounded-full ${isMuted ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'} flex items-center justify-center`}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </div>
              <span className="text-xs text-gray-300 uppercase tracking-widest">Sonido</span>
            </button>
          </div>
        </div>

        <div className="relative w-full" style={{ height: 1250 }}>
          <MapFilterBar onToggleView={() => alert('Próximamente: Vista de Tarjetas')} />
          <MapLegend />

          <div
            ref={globeWrapRef}
            className={`w-full h-full flex items-center justify-center relative z-10 mt-2 transition-all ${isInteractive ? 'cursor-move pointer-events-auto' : 'cursor-default pointer-events-none'}`}
            style={{ touchAction: isInteractive ? 'none' : 'auto' }}
          >
            <GlobeComp
              ref={globeEl}
              onGlobeReady={handleGlobeReady}
              globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
              backgroundColor="rgba(0,0,0,0)"
              pointsData={stories}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => '#F97316'}
              pointAltitude={0.01}
              pointRadius={0.24}
              ringsData={newsRings}
              ringColor={() => (t: number) => `rgba(255,255,255,${1 - t})`}
              ringMaxRadius="maxR"
              ringPropagationSpeed="propagationSpeed"
              ringRepeatPeriod="repeatPeriod"
              height={globeSize}
              width={globeSize}
            />
          </div>
        </div>
      </section>

        {/* FOOTER */}
        <footer className="w-full pb-28 pt-20 px-6 flex flex-col items-center relative z-20 bg-[#E0E5EC]" style={{ fontFamily: APP_FONT }}>
          <div className="mb-20 mt-10 w-full flex justify-center select-none">
            <h1 className="text-7xl md:text-[140px] text-center leading-none almamundi-footer-title">ALMAMUNDI</h1>
          </div>

          <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center md:items-end text-base font-medium border-t border-gray-300 pt-10 text-gray-600 gap-10">
            <div className="flex flex-col items-center md:items-start">
              <span className="block mb-3 opacity-70">Una iniciativa de</span>
              <img src="/logo-precisar.png" alt="Precisar" className="h-14 w-auto object-contain" />
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-10 opacity-90">
              <button onClick={() => setShowPurpose(true)} className="hover:text-gray-900 transition-colors font-bold" type="button">
                Propósito
              </button>

              <button onClick={() => setShowInspiration(true)} className="hover:text-gray-900 transition-colors font-bold flex items-center gap-2" type="button">
                <span>Inspiración</span>
              </button>

              <a href="#cuenta-tu-historia" className="hover:text-gray-900 transition-colors font-bold">
                Historias
              </a>
              <a href="#mapa" className="hover:text-gray-900 transition-colors font-bold">
                Mapa
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

   