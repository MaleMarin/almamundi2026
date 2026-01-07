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
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [err, setErr] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const imprintIdRef = useRef<string>('');

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
        // @ts-ignore
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
        // @ts-ignore
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
    return !!mediaBlob && !isRecording;
  }, [mode, text, isTextTooLong, mediaBlob, isRecording]);

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
    if (mode !== 'Texto' && !mediaBlob) {
      setErr('Primero graba tu audio/video.');
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
  }, [canSubmit, mode, text, mediaBlob]);

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
          <div className="px-8 pb-2">
            <div className="p-4 rounded-3xl text-sm font-bold" style={{ ...soft.inset, color: '#C2410C' }}>
              {err}
            </div>
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
                      style={{ ...soft.button, backgroundColor: '#F97316' }}
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
                      style={{ ...soft.button, backgroundColor: '#F97316' }}
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

                <div className="mt-6 flex flex-wrap gap-3 justify-end">
                  <button type="button" onClick={() => setStep('capture')} className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-gray-600 active:scale-95" style={soft.button}>
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit}
                    className="px-8 py-4 rounded-full text-xs font-black tracking-widest uppercase text-white active:scale-95 disabled:opacity-60"
                    style={{ ...soft.button, backgroundColor: '#F97316' }}
                  >
                    {saving ? 'Enviando…' : 'Enviar'}
                  </button>
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
    <main className="min-h-screen overflow-x-hidden relative" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
      <style jsx global>{globalStyles}</style>

      <audio ref={audioRef} loop src="/universo.mp3" />

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

      <InspirationModal
        isOpen={showInspiration}
        onClose={() => setShowInspiration(false)}
        topics={INSPIRATION_TOPICS}
        onChoose={(t) => {
          setChosenTopic(t);
          setShowInspiration(false);
          setModalMode('Texto');
        }}
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

          <a href="#historias" className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button}>
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

      {/* CARDS */}
      <section id="historias" className="w-full px-6 mb-28 flex flex-col md:flex-row gap-12 justify-center items-stretch relative z-10 -mt-12">
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

            <a href="#historias" className="hover:text-gray-900 transition-colors font-bold">
              Historias
            </a>
            <a href="#mapa" className="hover:text-gray-900 transition-colors font-bold">
              Mapa
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
