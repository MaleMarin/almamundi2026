'use client';

/**
 * Sala «el hilo» — experiencia inmersiva para una muestra curada (portal → canvas → historia).
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import styles from './SalaHilo.module.css';

export type SalaHiloHistoriaFormato = 'audio' | 'video' | 'texto' | 'foto';

export type SalaHiloHistoria = {
  id: string;
  titulo: string;
  quote: string;
  meta: string;
  formato: SalaHiloHistoriaFormato;
};

export type SalaHiloMuestraInput = {
  titulo: string;
  descripcion: string;
  curadora: string;
  historias: SalaHiloHistoria[];
};

function threadY(x: number, W: number, H: number, t: number): number {
  const amp = 38;
  const freq = (2 * Math.PI) / (W * 0.85);
  return (
    H * 0.52 +
    Math.sin(x * freq + t * 0.6) * amp +
    Math.sin(x * freq * 0.4 + t * 0.35) * 18
  );
}

function knotPositions(
  stories: SalaHiloHistoria[],
  W: number,
  H: number,
  t: number
): { x: number; y: number }[] {
  if (stories.length === 0) return [];
  if (stories.length === 1) {
    const x = W / 2;
    return [{ x, y: threadY(x, W, H, t) }];
  }
  const margin = W * 0.12;
  const spacing = (W - margin * 2) / (stories.length - 1);
  return stories.map((_, i) => {
    const x = margin + i * spacing;
    return { x, y: threadY(x, W, H, t) };
  });
}

type Particle = {
  id: string;
  left: number;
  top: number;
  tx: number;
  ty: number;
  size: number;
};

type Phase = 'portal' | 'hilo' | 'story';

export function SalaHilo({ muestra }: { muestra: SalaHiloMuestraInput }) {
  const uid = useId();
  const stories = muestra.historias;
  const total = stories.length;

  const [phase, setPhase] = useState<Phase>('portal');
  const [portalOpacity, setPortalOpacity] = useState(1);
  const [storyIndex, setStoryIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hintVisible, setHintVisible] = useState(true);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const mouseRef = useRef({ x: -999, y: -999 });
  const activeKnotRef = useRef(-1);
  const unraveledRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef(1);

  const appendParticles = useCallback((cx: number, cy: number) => {
    const next: Particle[] = [];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 50;
      next.push({
        id: `${uid}-p-${Date.now()}-${i}`,
        left: cx,
        top: cy,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size: 2 + Math.random() * 4,
      });
    }
    setParticles((p) => [...p, ...next]);
    window.setTimeout(() => {
      setParticles((p) => p.filter((x) => !next.some((n) => n.id === x.id)));
    }, 900);
  }, [uid]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = containerRef.current;
    if (!canvas || !wrap || phase === 'portal') return;

    const rect = wrap.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W < 2 || H < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const cw = Math.floor(W * dpr);
    const ch = Math.floor(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const t = tRef.current;
    const knots = knotPositions(stories, W, H, t);
    const mouse = mouseRef.current;
    const unraveled = unraveledRef.current;

    let active = -1;
    for (let i = 0; i < knots.length; i++) {
      const { x, y } = knots[i];
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      if (Math.hypot(dx, dy) < 22) active = i;
    }
    activeKnotRef.current = active;

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(210,170,90,0.15)');
    grad.addColorStop(0.5, 'rgba(230,190,110,0.85)');
    grad.addColorStop(1, 'rgba(210,170,90,0.15)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const step = 3;
    for (let x = 0; x <= W; x += step) {
      const y = threadY(x, W, H, t);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (let i = 0; i < knots.length; i++) {
      const { x, y } = knots[i];
      const isUnraveled = unraveled.has(i);
      const isActive = active === i;

      if (isUnraveled && !isActive) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(210,170,90,0.4)';
        ctx.fill();
        continue;
      }

      if (isActive) {
        const aura = ctx.createRadialGradient(x, y, 0, x, y, 26);
        aura.addColorStop(0, 'rgba(210,170,90,0.35)');
        aura.addColorStop(1, 'rgba(210,170,90,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();

        const kg = ctx.createRadialGradient(x, y, 0, x, y, 12);
        kg.addColorStop(0, '#f0d080');
        kg.addColorStop(0.55, '#d2aa5a');
        kg.addColorStop(1, '#8a6820');
        ctx.fillStyle = kg;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        const h = stories[i];
        const title = h.titulo;
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        let tw = ctx.measureText(title).width;
        let display = title;
        while (tw > 200 && display.length > 3) {
          display = display.slice(0, -1);
          tw = ctx.measureText(`${display}…`).width;
        }
        if (display !== title) display = `${display}…`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(display, x, y - 22);

        ctx.font = '600 10px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(210,170,90,0.7)';
        ctx.textBaseline = 'bottom';
        ctx.fillText(h.formato.toUpperCase(), x, y - 8);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        continue;
      }

      const kg = ctx.createRadialGradient(x, y, 0, x, y, 7);
      kg.addColorStop(0, '#f0d080');
      kg.addColorStop(0.55, '#d2aa5a');
      kg.addColorStop(1, '#8a6820');
      ctx.fillStyle = kg;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '600 9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(8,8,8,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }, [phase, stories]);

  useEffect(() => {
    if (phase === 'portal' || phase === 'story') return;

    const loop = () => {
      tRef.current += 0.012;
      drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, drawFrame]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || phase === 'portal') return;

    const ro = new ResizeObserver(() => {
      drawFrame();
    });
    ro.observe(el);
    drawFrame();
    return () => ro.disconnect();
  }, [phase, drawFrame]);

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    };
  };

  const onCanvasMouseLeave = () => {
    mouseRef.current = { x: -999, y: -999 };
  };

  const onCanvasClick = () => {
    const k = activeKnotRef.current;
    if (k < 0 || unraveledRef.current.has(k)) return;
    unraveledRef.current.add(k);
    setDiscoveredCount(unraveledRef.current.size);
    const canvas = canvasRef.current;
    if (canvas) {
      const wrap = containerRef.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const knots = knotPositions(stories, W, H, tRef.current);
        const { x, y } = knots[k] ?? { x: 0, y: 0 };
        appendParticles(x, y);
      }
    }
    setStoryIndex(k);
    setPhase('story');
    setHintVisible(false);
  };

  const closeStory = useCallback(() => setPhase('hilo'), []);

  const goPrevStory = useCallback(() => {
    setStoryIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  }, [total]);

  const goNextStory = useCallback(() => {
    setStoryIndex((i) => (i + 1) % Math.max(total, 1));
  }, [total]);

  useEffect(() => {
    if (phase !== 'story') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeStory();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevStory();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNextStory();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, closeStory, goPrevStory, goNextStory]);

  const enterSala = () => {
    setPortalOpacity(0);
    window.setTimeout(() => {
      setPhase('hilo');
      setPortalOpacity(1);
    }, 600);
  };

  const exitToPortal = () => {
    setPhase('portal');
    unraveledRef.current = new Set();
    setDiscoveredCount(0);
    setHintVisible(true);
    setParticles([]);
  };

  const current = stories[storyIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#080808',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        zIndex: 40,
      }}
    >
      {phase === 'portal' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 48,
            opacity: portalOpacity,
            transition: 'opacity 0.6s ease',
            boxSizing: 'border-box',
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: '#d2aa5a',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            SALA · MUESTRA CURADA
          </p>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#fff',
              maxWidth: 600,
              lineHeight: 1.08,
            }}
          >
            {muestra.titulo}
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Curada por {muestra.curadora}
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 15,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              maxWidth: 480,
              whiteSpace: 'pre-wrap',
            }}
          >
            {muestra.descripcion}
          </p>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            {total} historias
          </p>
          <button
            type="button"
            onClick={enterSala}
            style={{
              marginTop: 28,
              alignSelf: 'flex-start',
              background: '#d2aa5a',
              color: '#080808',
              border: 'none',
              borderRadius: 100,
              padding: '14px 32px',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Entrar a la sala →
          </button>
        </div>
      )}

      {phase !== 'portal' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={onCanvasMouseMove}
              onMouseLeave={onCanvasMouseLeave}
              onClick={onCanvasClick}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
              }}
            />
            {particles.map((p) => (
              <span
                key={p.id}
                className={styles.hiloParticle}
                style={
                  {
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    marginLeft: -p.size / 2,
                    marginTop: -p.size / 2,
                    zIndex: 5,
                    ['--tx' as string]: `${p.tx}px`,
                    ['--ty' as string]: `${p.ty}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          <p
            style={{
              position: 'absolute',
              top: 24,
              left: 32,
              zIndex: 15,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'lowercase',
              color: 'rgba(255,255,255,0.2)',
              margin: 0,
              pointerEvents: 'none',
            }}
          >
            sala · muestra curada
          </p>
          <p
            style={{
              position: 'absolute',
              top: 24,
              right: 120,
              zIndex: 15,
              fontSize: 11,
              color: 'rgba(255,255,255,0.18)',
              margin: 0,
              pointerEvents: 'none',
            }}
          >
            {discoveredCount} / {total} historias descubiertas
          </p>
          <button
            type="button"
            onClick={exitToPortal}
            style={{
              position: 'absolute',
              top: 20,
              right: 32,
              zIndex: 15,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.45)',
              borderRadius: 100,
              padding: '8px 16px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ✕ Salir
          </button>
          {hintVisible && (
            <p
              style={{
                position: 'absolute',
                bottom: 28,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.2)',
                margin: 0,
                textAlign: 'center',
                pointerEvents: 'none',
                maxWidth: '90%',
              }}
            >
              acercate a un nudo para descubrir la historia
            </p>
          )}
        </div>
      )}

      {phase === 'story' && current && (
        <div
          className={styles.hiloStoryOverlay}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#080808',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 48,
            boxSizing: 'border-box',
          }}
        >
          <div
            className={styles.hiloThreadLine}
            style={{
              position: 'absolute',
              left: 48,
              top: 0,
              width: 1,
              height: 0,
              background:
                'linear-gradient(to bottom, rgba(210,170,90,0.6), transparent)',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#d2aa5a',
                margin: '0 0 12px',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#d2aa5a',
                  display: 'inline-block',
                }}
              />
              {current.formato.toUpperCase()}
            </p>
            <h2
              className={styles.hiloStoryTitle}
              style={{
                margin: 0,
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                maxWidth: 520,
                lineHeight: 1.1,
              }}
            >
              {current.titulo}
            </h2>
            <p
              className={styles.hiloStoryQuote}
              style={{
                margin: '16px 0 0',
                fontSize: 16,
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.7,
                maxWidth: 480,
              }}
            >
              “{current.quote}”
            </p>
            <p
              className={styles.hiloStoryMeta}
              style={{
                margin: '20px 0 32px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.28)',
              }}
            >
              {current.meta}
            </p>
            <div
              className={styles.hiloStoryActions}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}
            >
              <Link
                href={`/historias/${current.id}/${current.formato}`}
                style={{
                  display: 'inline-block',
                  background: '#d2aa5a',
                  color: '#080808',
                  borderRadius: 100,
                  padding: '12px 28px',
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Abrir esta historia
              </Link>
              <button
                type="button"
                onClick={closeStory}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.35)',
                  borderRadius: 100,
                  padding: '12px 28px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                ← Volver al hilo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
