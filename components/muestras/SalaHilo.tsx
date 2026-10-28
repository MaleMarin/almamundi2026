'use client';

/**
 * Sala «el hilo» — portal 3D (gel + perspectiva) → escena Three (hilo + nudos); click en nudo → panel historia en página.
 * Estilos solo inline + keyframes locales (sin Tailwind ni CSS module).
 */
import type { ComponentType } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { kpos, ty } from '@/lib/muestras/sala-hilo-thread-math';
import type { SalaHiloThread3DProps } from '@/components/muestras/SalaHiloThread3D';

/** WebGL solo en cliente: evita hidratación con canvas 0×0 y asegura medidas reales del contenedor. */
/** Sin `loading` distinto al SSR: evita mismatch de hidratación con Next 16 + Turbopack. */
const SalaHiloThread3D = dynamic(
  () =>
    import('@/components/muestras/SalaHiloThread3D').then((m) => m.SalaHiloThread3D),
  { ssr: false, loading: () => null }
) as ComponentType<SalaHiloThread3DProps>;

const LiquidLightBackground = dynamic(
  () =>
    import('@/components/LiquidLightBackground').then((m) => m.LiquidLightBackground),
  { ssr: false, loading: () => null }
);

/** Curva 2D (misma fórmula y `t` que el 3D): siempre visible; puntos en `kpos`. */
function HiloSvgGuide({
  w,
  h,
  knotCount,
  t,
}: {
  w: number;
  h: number;
  /** Puntos del hilo (mismas posiciones que `kpos` en 3D). */
  knotCount: number;
  /** Tiempo de animación compartido con la escena WebGL (estado en el padre). */
  t: number;
}) {
  if (w < 16 || h < 16) return null;
  const knots = knotCount > 0 ? kpos(w, h, t, knotCount) : [];
  const step = Math.max(3, Math.floor(w / 160));
  const pts: string[] = [];
  for (let x = 0; x <= w; x += step) {
    pts.push(`${x},${ty(x, w, h, t)}`);
  }
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 1,
      }}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="#e8d5a8"
        strokeWidth={Math.max(1.35, w * 0.0022)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
        points={pts.join(' ')}
      />
      <polyline
        fill="none"
        stroke="#c9a227"
        strokeWidth={Math.max(0.85, w * 0.00115)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.98}
        points={pts.join(' ')}
      />
      <polyline
        fill="none"
        stroke="#ffe9a6"
        strokeWidth={Math.max(0.4, w * 0.00055)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        points={pts.join(' ')}
      />
      {knots.map((k, i) => (
        <circle
          key={`knot-${i}`}
          cx={k.x}
          cy={k.y}
          r={Math.max(2.4, w * 0.0036)}
          fill="rgba(255, 252, 246, 0.22)"
          stroke="rgba(148, 124, 72, 0.5)"
          strokeWidth={Math.max(0.35, w * 0.00032)}
          opacity={1}
        />
      ))}
    </svg>
  );
}

export type SalaHiloMuestraInput = {
  titulo: string;
  descripcion: string;
  curadora: string;
  historias: {
    id: string;
    titulo: string;
    quote: string;
    meta: string;
    formato: string;
    context?: string;
    alias?: string;
    date?: string;
  }[];
};

type Particle = {
  id: string;
  left: number;
  top: number;
  tx: number;
  ty: number;
  size: number;
};

type Phase = 'portal' | 'hilo';

const BG = '#e6e9ee';
const ACCENT = '#FF4A1C';
const TEXT_PRIMARY = '#1a1f2a';
const TEXT_MUTED = '#9299a8';
const TEXT_HINT = '#b0b6c2';
const SHADOW_DARK = '#c4c7cd';
const SHADOW_LIGHT = '#ffffff';

export function SalaHilo({
  muestra,
  skipPortal,
}: {
  muestra: SalaHiloMuestraInput;
  /** Si es true, se omite la tarjeta «SALA · MUESTRA CURADA» y se entra al hilo; «Salir» vuelve al listado o al portal. `?portal=1` en la URL muestra primero la tarjeta. */
  skipPortal: boolean;
}) {
  const router = useRouter();
  const uid = useId().replace(/:/g, '');
  const stories = muestra.historias;
  const total = stories.length;

  const [phase, setPhase] = useState<Phase>(() =>
    skipPortal ? 'hilo' : 'portal'
  );
  const [portalOpacity, setPortalOpacity] = useState(1);
  const [salaOpacity, setSalaOpacity] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [canvasCssH, setCanvasCssH] = useState(420);
  const [selectedKnot, setSelectedKnot] = useState<number | null>(null);
  const [knotPanelOpen, setKnotPanelOpen] = useState(false);
  const [threadDims, setThreadDims] = useState({ w: 640, h: 420 });
  /** Evita hidratación: no montar SVG animado + WebGL hasta el cliente (mismo HTML servidor/cliente en 1er paso). */
  const [threadMounted, setThreadMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(0);
  /** Replica `tRef` para el SVG sin leer refs en render (regla react-hooks/refs). */
  const [threadCurveT, setThreadCurveT] = useState(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const activeKnotRef = useRef(-1);
  const unraveledRef = useRef<Set<number>>(new Set());

  const appendParticles = useCallback((cx: number, cy: number) => {
    const next: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 35;
      next.push({
        id: `${uid}-p-${Date.now()}-${i}`,
        left: cx,
        top: cy,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size: 3 + Math.random() * 3,
      });
    }
    setParticles((p) => [...p, ...next]);
    window.setTimeout(() => {
      setParticles((p) => p.filter((x) => !next.some((n) => n.id === x.id)));
    }, 900);
  }, [uid]);

  useEffect(() => {
    queueMicrotask(() => setThreadMounted(true));
  }, []);

  useEffect(() => {
    if (phase !== 'hilo') return;
    tRef.current = 0;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) setThreadCurveT(0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [phase]);

  /** Mismo `t` para la guía SVG y la escena 3D (antes solo lo avanzaba R3F). */
  useEffect(() => {
    if (phase !== 'hilo' || !threadMounted) return;
    let id = 0;
    const tick = () => {
      tRef.current += 0.01;
      setThreadCurveT((v) => v + 0.01);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase, threadMounted]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || phase === 'portal') return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(8, Math.floor(r.width));
      const h = Math.max(8, Math.floor(r.height));
      setThreadDims((d) => (d.w === w && d.h === h ? d : { w, h }));
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [phase, threadMounted]);

  /* Tras navegación SPA, el layout puede estabilizarse un frame después: re-medir el canvas del hilo. */
  useLayoutEffect(() => {
    if (phase !== 'hilo') return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        const el = containerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const w = Math.max(8, Math.floor(r.width));
        const h = Math.max(8, Math.floor(r.height));
        setThreadDims((d) => (d.w === w && d.h === h ? d : { w, h }));
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [phase, threadMounted]);

  useEffect(() => {
    const upd = () =>
      setCanvasCssH(Math.max(420, window.innerHeight - 200));
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    if (selectedKnot === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedKnot(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedKnot]);

  useLayoutEffect(() => {
    if (selectedKnot === null) setKnotPanelOpen(false);
  }, [selectedKnot]);

  useEffect(() => {
    if (selectedKnot === null) return;
    const id = requestAnimationFrame(() => setKnotPanelOpen(true));
    return () => cancelAnimationFrame(id);
  }, [selectedKnot]);

  const setPointerFromClient = (clientX: number, clientY: number) => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    mouseRef.current = {
      x: clientX - r.left,
      y: clientY - r.top,
    };
  };

  const onThreadPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setPointerFromClient(e.clientX, e.clientY);
  };

  const onThreadPointerLeave = () => {
    mouseRef.current = { x: -9999, y: -9999 };
  };

  const onKnotPick = useCallback(
    (k: number) => {
      if (k < 0 || k >= stories.length) return;
      const firstVisit = !unraveledRef.current.has(k);
      if (firstVisit) {
        unraveledRef.current.add(k);
        setDiscoveredCount(unraveledRef.current.size);
        const wrap = containerRef.current;
        if (wrap) {
          const rect = wrap.getBoundingClientRect();
          const W = rect.width;
          const H = rect.height;
          const knots = kpos(W, H, tRef.current, stories.length);
          const kn = knots[k];
          if (kn) appendParticles(kn.x, kn.y);
        }
      }
      setSelectedKnot(k);
    },
    [stories, appendParticles]
  );

  const onThreadTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const tch = e.touches[0];
    if (!tch) return;
    e.preventDefault();
    setPointerFromClient(tch.clientX, tch.clientY);
    onKnotPick(activeKnotRef.current);
  };

  const enterSala = () => {
    setPortalOpacity(0);
    window.setTimeout(() => {
      setPhase('hilo');
      setPortalOpacity(1);
      setSalaOpacity(1);
    }, 700);
  };

  const exitToPortal = () => {
    if (skipPortal) {
      router.push('/muestras');
      return;
    }
    setSalaOpacity(0);
    window.setTimeout(() => {
      setPhase('portal');
      unraveledRef.current = new Set();
      setDiscoveredCount(0);
      setSelectedKnot(null);
      setParticles([]);
      setSalaOpacity(1);
    }, 700);
  };

  const styleTag = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes salaHiloParticle_${uid} {
  from { opacity: 0.7; transform: translate(0,0) scale(1); }
  to { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.1); }
}
`,
      }}
    />
  );

  const portalBackdrop = `radial-gradient(120% 85% at 50% 12%, rgba(255,255,255,0.5) 0%, transparent 50%),
    radial-gradient(90% 70% at 10% 90%, rgba(222,228,238,0.95) 0%, transparent 55%),
    radial-gradient(85% 65% at 92% 75%, rgba(212,220,234,0.9) 0%, transparent 48%),
    linear-gradient(168deg, #e2e6ee 0%, ${BG} 44%, #d8dee8 100%)`;

  return (
    <main
      className="relative z-[45] flex w-full min-w-0 flex-1 shrink-0 flex-col"
      style={{
        minHeight: 'max(32rem, calc(100dvh - 7rem))',
        background: BG,
        color: TEXT_PRIMARY,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {styleTag}

      {phase === 'portal' && (
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px 0 40px',
            opacity: portalOpacity,
            transition: 'opacity 0.7s ease',
            pointerEvents: portalOpacity > 0 ? 'auto' : 'none',
            overflow: 'auto',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              background: portalBackdrop,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8vw',
              perspective: '1600px',
            }}
          >
            <div
              style={{
                transform: 'rotateX(5deg) translateZ(0)',
                transformStyle: 'preserve-3d',
                maxWidth: 920,
                padding: 'clamp(22px, 4.5vw, 48px)',
                borderRadius: 28,
                background: 'rgba(236, 239, 244, 0.52)',
                backdropFilter: 'blur(16px) saturate(120%)',
                WebkitBackdropFilter: 'blur(16px) saturate(120%)',
                boxShadow:
                  '22px 32px 56px rgba(85, 98, 118, 0.28), -14px -20px 44px rgba(255, 255, 255, 0.82), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#FF4A1C',
              marginTop: 0,
              marginRight: 0,
              marginBottom: 20,
              marginLeft: 0,
            }}
          >
            sala · muestra curada
          </p>

          <h1
            style={{
              fontSize: 'clamp(42px, 7vw, 80px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              color: '#1a1f2a',
              maxWidth: 700,
              marginTop: 0,
              marginRight: 0,
              marginBottom: 16,
              marginLeft: 0,
            }}
          >
            {muestra.titulo}
          </h1>

          <p
            style={{
              fontSize: 13,
              color: '#9299a8',
              marginTop: 0,
              marginRight: 0,
              marginBottom: 16,
              marginLeft: 0,
              letterSpacing: '0.02em',
            }}
          >
            Curada por {muestra.curadora}
          </p>

          <p
            style={{
              fontSize: 16,
              color: '#5a6070',
              lineHeight: 1.75,
              maxWidth: 480,
              marginTop: 0,
              marginRight: 0,
              marginBottom: 8,
              marginLeft: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {muestra.descripcion}
          </p>

          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#b0b6c2',
              marginTop: 0,
              marginRight: 0,
              marginBottom: 44,
              marginLeft: 0,
            }}
          >
            {muestra.historias.length} historias
          </p>

          <button
            type="button"
            onClick={enterSala}
            style={{
              alignSelf: 'flex-start',
              background: '#e6e9ee',
              color: '#FF4A1C',
              border: 'none',
              padding: '15px 36px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'none',
              boxShadow: '6px 6px 12px #c4c7cd, -6px -6px 12px #ffffff',
            }}
          >
            Entrar a la sala →
          </button>
            </div>

          <div
            style={{
              position: 'relative',
              marginTop: 28,
              left: 0,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                background: '#b0b6c2',
                position: 'relative',
                overflow: 'hidden',
              }}
            />
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#b0b6c2',
              }}
            >
              AlmaMundi
            </span>
          </div>
          </div>
        </div>
      )}

      {phase === 'hilo' && (
        <div
          style={{
            position: 'relative',
            flex: '1 1 auto',
            minHeight: 'min(90vh, 920px)',
            backgroundColor: 'transparent',
            overflowX: 'hidden',
            overflowY: 'auto',
            opacity: salaOpacity,
            transition: 'opacity 0.7s ease',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              background: portalBackdrop,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '20px 36px',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: TEXT_HINT,
                justifySelf: 'start',
              }}
            >
              AlmaMundi · sala
            </span>
            <span
              style={{
                fontSize: 11,
                color: TEXT_MUTED,
                opacity: discoveredCount > 0 ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {discoveredCount} / {total} descubiertas
            </span>
            <button
              type="button"
              onClick={exitToPortal}
              style={{
                justifySelf: 'end',
                pointerEvents: 'auto',
                background: BG,
                border: 'none',
                color: TEXT_MUTED,
                padding: '7px 18px',
                borderRadius: 100,
                boxShadow: `3px 3px 6px ${SHADOW_DARK}, -3px -3px 6px ${SHADOW_LIGHT}`,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕ Salir
            </button>
          </div>

          <div
            ref={containerRef}
            onMouseMove={onThreadPointerMove}
            onMouseLeave={onThreadPointerLeave}
            onTouchStart={onThreadTouchStart}
            style={{
              width: '100vw',
              maxWidth: '100vw',
              left: '50%',
              transform: 'translateX(-50%)',
              height: canvasCssH,
              minHeight: 'clamp(320px, 48vh, 680px)',
              marginTop: 56,
              marginBottom: 0,
              position: 'relative',
              zIndex: 4,
              cursor: 'crosshair',
              touchAction: 'none',
              background:
                'linear-gradient(180deg, rgba(255,252,240,0.22) 0%, rgba(236,240,248,0.14) 45%, rgba(224,230,240,0.18) 100%)',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {!threadMounted ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#b0b6c2',
                  zIndex: 3,
                }}
                aria-busy
              >
                Cargando hilo…
              </div>
            ) : (
              <>
                <LiquidLightBackground fillParent />
                <HiloSvgGuide
                  w={threadDims.w}
                  h={threadDims.h}
                  knotCount={stories.length}
                  t={threadCurveT}
                />
                <SalaHiloThread3D
                  width={threadDims.w}
                  height={threadDims.h}
                  stories={stories}
                  tRef={tRef}
                  mouseRef={mouseRef}
                  activeKnotRef={activeKnotRef}
                  unraveledRef={unraveledRef}
                  onKnotPick={onKnotPick}
                  discoveredCount={discoveredCount}
                />
              </>
            )}
            {particles.map((p) => (
              <span
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  background: ACCENT,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 5,
                  animation: `salaHiloParticle_${uid} 0.8s forwards`,
                  ['--tx' as string]: `${p.tx}px`,
                  ['--ty' as string]: `${p.ty}px`,
                }}
              />
            ))}
          </div>

          {selectedKnot === null ? (
            <p
              style={{
                position: 'relative',
                zIndex: 8,
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: TEXT_HINT,
                margin: 0,
                padding: '12px 16px 24px',
                textAlign: 'center',
                maxWidth: '90%',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Acércate a un nudo del hilo y haz clic para descubrir la historia
            </p>
          ) : null}

          {selectedKnot !== null && stories[selectedKnot] ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Historia en la sala"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                background: BG,
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
                padding: '28px 36px 36px',
                transform: knotPanelOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: knotPanelOpen ? 'auto' : 'none',
              }}
            >
              {(() => {
                const historia = stories[selectedKnot];
                const formatoLabel = (historia.formato || 'video').toUpperCase();
                const quoteBody =
                  historia.context?.trim() ||
                  historia.quote?.trim() ||
                  '—';
                const metaLine =
                  historia.alias != null &&
                  historia.alias !== '' &&
                  historia.date != null &&
                  historia.date !== ''
                    ? `${historia.alias} · ${historia.date}`
                    : historia.meta;
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 24,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: ACCENT,
                            flexShrink: 0,
                          }}
                          aria-hidden
                        />
                        <span
                          style={{
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            color: ACCENT,
                          }}
                        >
                          {formatoLabel}
                        </span>
                      </div>
                      <h2
                        style={{
                          fontSize: 32,
                          fontWeight: 800,
                          letterSpacing: '-0.025em',
                          lineHeight: 1.1,
                          color: TEXT_PRIMARY,
                          maxWidth: 520,
                          margin: '0 0 10px 0',
                        }}
                      >
                        {historia.titulo}
                      </h2>
                      <p
                        style={{
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: '#7a8292',
                          lineHeight: 1.75,
                          maxWidth: 480,
                          margin: '0 0 12px 0',
                        }}
                      >
                        {quoteBody}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#b0b6c2',
                          margin: 0,
                        }}
                      >
                        {metaLine}
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        paddingTop: 4,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/historias/${historia.id}/${historia.formato || 'video'}`
                          )
                        }
                        style={{
                          background: ACCENT,
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        Abrir esta historia →
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedKnot(null)}
                        style={{
                          background: BG,
                          color: TEXT_MUTED,
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: 100,
                          fontSize: 12,
                          boxShadow: `3px 3px 6px ${SHADOW_DARK}, -3px -3px 6px ${SHADOW_LIGHT}`,
                          cursor: 'pointer',
                        }}
                      >
                        ← Cerrar
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
