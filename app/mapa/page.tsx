'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Grid,
  Bookmark,
  ChevronDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { INSPIRATION_TOPICS } from '@/lib/topics';

const GlobeComp = dynamic(() => import('react-globe.gl'), { ssr: false });

const APP_FONT = 'Avenir, sans-serif';

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
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

type StoryPoint = { lat: number; lng: number; label: string };
type NewsRing = { lat: number; lng: number; maxR: number; propagationSpeed: number; repeatPeriod: number };

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(900);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect?.width ?? 900);
    });
    ro.observe(el);
    setWidth(el.clientWidth || 900);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/* ----- MapLegend: solo "Historias" y "Actualidad" (sin "Memoria" en UI) ----- */
function MapLegend() {
  return (
    <div className="absolute top-8 left-6 z-[80] pointer-events-none hidden lg:block">
      <div
        className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[26px] shadow-lg max-w-xs animate-float"
        style={{ fontFamily: APP_FONT }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
          <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">Historias</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Actualidad</span>
        </div>
      </div>
    </div>
  );
}

/* ----- Portal del dropdown Temas (solo contenido, sin franja) ----- */
function TopicsDropdownPortal({
  open,
  buttonRef
}: {
  open: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    setDropdownRect(buttonRef.current.getBoundingClientRect());
  }, [open, buttonRef]);

  if (!open || typeof document === 'undefined') return null;
  const content = (
    <div
      id="temas-dropdown-portal"
      className="fixed z-[9999] min-w-[280px] max-w-[90vw] max-h-[70vh] overflow-y-auto rounded-[24px] shadow-2xl border border-white/20 bg-[#E0E5EC] p-4 hide-scrollbar"
      style={{
        top: dropdownRect ? dropdownRect.bottom + 8 : 0,
        left: dropdownRect ? Math.min(dropdownRect.left, window.innerWidth - 320) : 0,
        fontFamily: APP_FONT,
        ...soft.flat
      }}
    >
      <div className="text-xs font-black tracking-widest uppercase text-gray-500 mb-3 px-2">Temas</div>
      {INSPIRATION_TOPICS.map((t) => (
        <button
          key={t.title}
          type="button"
          className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/60 active:scale-[0.99] transition-all text-gray-700 font-medium text-sm"
        >
          {t.title}
        </button>
      ))}
    </div>
  );
  return createPortal(content, document.body);
}

/* ----- Panel derecho: título + búsqueda + acciones (Temas, Explorar, Colecciones, Sonido) + vistas ----- */
function RightPanel({
  topicsOpen,
  onTopicsToggle,
  topicsButtonRef,
  isMuted,
  onToggleAudio
}: {
  topicsOpen: boolean;
  onTopicsToggle: () => void;
  topicsButtonRef: React.RefObject<HTMLButtonElement | null>;
  isMuted: boolean;
  onToggleAudio: () => void;
}) {
  const [activeView, setActiveView] = useState<'historias' | 'actualidad' | 'envivo'>('historias');

  const views = [
    {
      id: 'historias' as const,
      title: 'Historias',
      description: 'Relatos en primera persona. Cada punto es una historia guardada en el archivo vivo de AlmaMundi.'
    },
    {
      id: 'actualidad' as const,
      title: 'Actualidad',
      description: 'Pulsos en tiempo real. Noticias y acontecimientos que están pasando ahora en el mundo.'
    },
    {
      id: 'envivo' as const,
      title: 'En vivo',
      description: 'Contenido en streaming y eventos en directo vinculados a lugares del mapa.'
    }
  ];

  return (
    <div
      className="absolute top-0 right-0 bottom-0 w-full max-w-md lg:max-w-[420px] z-[70] flex flex-col bg-[#1A202C]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl p-8 overflow-y-auto hide-scrollbar"
      style={{ fontFamily: APP_FONT }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 mt-4">
        Explora el mapa
      </h2>
      <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
        Tres formas de mirar el mundo en AlmaMundi. Elige una y haz clic en un punto para abrirlo.
      </p>

      {/* Búsqueda de ciudad dentro del panel */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Buscar ciudad…"
          className="w-full pl-12 pr-5 py-3 rounded-2xl outline-none text-gray-800 placeholder-gray-500 text-sm font-medium border border-white/10 bg-white/10 focus:bg-white/15 focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Acciones: Temas, Explorar, Colecciones, Sonido */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          ref={topicsButtonRef}
          type="button"
          onClick={onTopicsToggle}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors"
        >
          <Filter size={18} />
          Temas
          <ChevronDown size={16} className={topicsOpen ? 'rotate-180' : ''} />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors"
        >
          <Grid size={18} />
          Explorar
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors relative"
          aria-label="Mis colecciones"
        >
          <Bookmark size={18} className="fill-current opacity-70" />
          Colecciones
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button
          type="button"
          onClick={onToggleAudio}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          Sonido
        </button>
      </div>

      <div className="space-y-4">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActiveView(v.id)}
            className={`w-full text-left p-6 rounded-[24px] border transition-all duration-200 ${
              activeView === v.id
                ? 'bg-white/15 border-orange-500/50 shadow-lg'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <span className={`block text-lg font-bold mb-2 ${activeView === v.id ? 'text-orange-400' : 'text-white'}`}>
              {v.title}
            </span>
            <p className="text-sm text-gray-400 leading-relaxed">
              {v.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MapaPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const globeEl = useRef<any>(null);
  const { ref: globeWrapRef, width: globeWrapWidth } = useElementWidth<HTMLDivElement>();
  const globeSize = Math.min(1100, Math.max(360, globeWrapWidth));
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicsButtonRef = useRef<HTMLButtonElement | null>(null);

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
      setNewsRings((prev) => {
        const r: NewsRing = {
          lat: (Math.random() - 0.5) * 160,
          lng: (Math.random() - 0.5) * 360,
          maxR: Math.random() * 20 + 3,
          propagationSpeed: (Math.random() - 0.5) * 20 + 1,
          repeatPeriod: Math.random() * 2000 + 200
        };
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
    const close = (e: MouseEvent) => {
      if (!topicsOpen) return;
      const target = e.target as Node;
      if (topicsButtonRef.current?.contains(target)) return;
      const portal = document.getElementById('temas-dropdown-portal');
      if (portal?.contains(target)) return;
      setTopicsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [topicsOpen]);

  return (
    <main
      className="min-h-screen overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1A202C 50%, #0F172A 100%)', fontFamily: APP_FONT }}
    >
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <audio ref={audioRef} loop src="/universo.mp3" />

      <TopicsDropdownPortal open={topicsOpen} buttonRef={topicsButtonRef} />
      <MapLegend />
      <RightPanel
        topicsOpen={topicsOpen}
        onTopicsToggle={() => setTopicsOpen((v) => !v)}
        topicsButtonRef={topicsButtonRef}
        isMuted={isMuted}
        onToggleAudio={toggleAudio}
      />

      <div
        ref={globeWrapRef}
        className="w-full h-screen flex items-center justify-center relative z-10 cursor-move pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        <GlobeComp
          ref={globeEl}
          onGlobeReady={handleGlobeReady}
          globeImageUrl="/textures/earth-night.jpg"
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
    </main>
  );
}
