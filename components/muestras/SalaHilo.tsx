'use client';

/**
 * Sala «el hilo» — portal 3D (gel + perspectiva) → escena Three (hilo + nudos); click en nudo → historia.
 * Estilos solo inline + keyframes locales (sin Tailwind ni CSS module).
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { SalaHiloThread3D } from '@/components/muestras/SalaHiloThread3D';
import { kpos } from '@/lib/muestras/sala-hilo-thread-math';

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
  const [storyOverlay, setStoryOverlay] = useState<{
    id: string;
    formato: string;
  } | null>(null);
  const [threadDims, setThreadDims] = useState({ w: 640, h: 420 });

  const containerRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(0);
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
  }, [phase]);

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
  }, [phase]);

  useEffect(() => {
    const upd = () =>
      setCanvasCssH(Math.max(420, window.innerHeight - 200));
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    if (!storyOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStoryOverlay(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [storyOverlay]);

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

  const navigateToHistoriaFromKnot = useCallback(
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
      const s = stories[k];
      const formato = s.formato || 'video';
      setStoryOverlay({ id: s.id, formato });
    },
    [stories, appendParticles]
  );

  const onThreadTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const tch = e.touches[0];
    if (!tch) return;
    e.preventDefault();
    setPointerFromClient(tch.clientX, tch.clientY);
    navigateToHistoriaFromKnot(activeKnotRef.current);
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
              width: '100%',
              maxWidth: 1100,
              height: canvasCssH,
              minHeight: 'clamp(360px, 52vh, 720px)',
              margin: '0 auto',
              marginTop: 72,
              position: 'relative',
              zIndex: 4,
              cursor: 'crosshair',
              touchAction: 'none',
              background: 'rgba(230, 233, 238, 0.35)',
              borderRadius: 16,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
            }}
          >
            <SalaHiloThread3D
              width={threadDims.w}
              height={threadDims.h}
              stories={stories}
              tRef={tRef}
              mouseRef={mouseRef}
              activeKnotRef={activeKnotRef}
              unraveledRef={unraveledRef}
              onKnotPick={navigateToHistoriaFromKnot}
            />
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

          <p
            style={{
              position: 'relative',
              zIndex: 8,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: TEXT_HINT,
              margin: 0,
              padding: '12px 16px 8px',
              textAlign: 'center',
              maxWidth: '90%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Tocá un nudo en el hilo o elegí una historia abajo
          </p>

          <div
            style={{
              position: 'relative',
              zIndex: 8,
              padding: '8px 16px 28px',
              maxWidth: 920,
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: TEXT_MUTED,
                margin: '0 0 14px',
                textAlign: 'center',
              }}
            >
              Historias en esta sala ({total})
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'center',
              }}
            >
              {stories.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigateToHistoriaFromKnot(i)}
                    style={{
                      display: 'inline-block',
                      maxWidth: 'min(100vw - 48px, 280px)',
                      padding: '10px 16px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      color: TEXT_PRIMARY,
                      background: BG,
                      boxShadow: `4px 4px 10px ${SHADOW_DARK}, -3px -3px 9px ${SHADOW_LIGHT}`,
                    }}
                  >
                    {s.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {storyOverlay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Historia en la sala"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(26, 31, 42, 0.42)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 20px',
              flexShrink: 0,
              background: BG,
              borderBottom: `1px solid rgba(180, 185, 195, 0.45)`,
              boxShadow: `0 4px 14px rgba(125, 142, 165, 0.2)`,
            }}
          >
            <button
              type="button"
              onClick={() => setStoryOverlay(null)}
              style={{
                background: BG,
                border: 'none',
                color: ACCENT,
                padding: '10px 22px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: `4px 4px 10px ${SHADOW_DARK}, -3px -3px 8px ${SHADOW_LIGHT}`,
              }}
            >
              ← Volver a la sala
            </button>
          </div>
          <iframe
            key={`${storyOverlay.id}-${storyOverlay.formato}`}
            title="Historia"
            src={`/historias/${storyOverlay.id}/${storyOverlay.formato}`}
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              border: 'none',
              background: '#e6e9ee',
            }}
          />
        </div>
      )}
    </main>
  );
}
