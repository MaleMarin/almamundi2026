'use client';

/**
 * Sala «el hilo» — portal neumórfico → canvas (hilo + nudos); click en nudo → historia.
 * Estilos solo inline + keyframes locales (sin Tailwind ni CSS module).
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { LiquidLightBackground } from '@/components/LiquidLightBackground';

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

const ty = (x: number, W: number, H: number, t: number) => {
  const amp = 36;
  const freq = (2 * Math.PI) / (W * 0.88);
  return (
    H * 0.48 +
    Math.sin(x * freq + t * 0.5) * amp +
    Math.sin(x * freq * 0.4 + t * 0.28) * 15
  );
};

const kpos = (W: number, H: number, t: number, count: number) => {
  if (count <= 0) return [];
  if (count === 1) {
    const x = W / 2;
    return [{ x, y: ty(x, W, H, t) }];
  }
  const mg = W * 0.1;
  const sp = (W - mg * 2) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const x = mg + i * sp;
    return { x, y: ty(x, W, H, t) };
  });
};

function truncThreeWords(s: string): string {
  const w = s.trim().split(/\s+/).filter(Boolean);
  if (w.length <= 3) return w.join(' ');
  return `${w.slice(0, 3).join(' ')}…`;
}

/** Sombra elíptica bajo esfera (contacto con “suelo”). */
function drawGroundEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number
) {
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.36, r * 0.95, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(55,65,80,${alpha})`;
  ctx.fill();
}

/** Nudo como esfera iluminada (gradiente + highlight especular). */
function drawKnotSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  variant: 'idle' | 'hover' | 'done'
) {
  const lx = x - r * 0.38;
  const ly = y - r * 0.4;
  if (variant !== 'done') {
    drawGroundEllipse(ctx, x, y, r, 0.1);
  }
  const g = ctx.createRadialGradient(lx, ly, Math.max(1, r * 0.08), x, y, r * 1.08);
  if (variant === 'hover') {
    g.addColorStop(0, 'rgba(255,255,255,0.98)');
    g.addColorStop(0.28, '#f2f4f8');
    g.addColorStop(0.62, '#dce1ea');
    g.addColorStop(1, '#b9c2d0');
  } else if (variant === 'done') {
    g.addColorStop(0, '#f0f2f6');
    g.addColorStop(0.45, '#e0e4ec');
    g.addColorStop(1, '#c5ccd8');
  } else {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.32, '#eef1f7');
    g.addColorStop(0.72, '#d8dee8');
    g.addColorStop(1, '#c1c9d6');
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.34, Math.max(1.5, r * 0.2), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
}

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
const TEXT_SECONDARY = '#5a6070';
const TEXT_MUTED = '#9299a8';
const TEXT_HINT = '#b0b6c2';
const SHADOW_DARK = '#c4c7cd';
const SHADOW_LIGHT = '#ffffff';

/** Superficie un poco más clara que `BG` + sombras duales para relieve neumórfico legible. */
const TITLE_NEU_BG = '#eef1f6';
const TITLE_NEU_SHADOW =
  '14px 14px 34px rgba(125, 142, 165, 0.48), -12px -12px 30px rgba(255, 255, 255, 0.94)';

export function SalaHilo({ muestra }: { muestra: SalaHiloMuestraInput }) {
  const uid = useId().replace(/:/g, '');
  const stories = muestra.historias;
  const total = stories.length;

  const [phase, setPhase] = useState<Phase>('portal');
  const [portalOpacity, setPortalOpacity] = useState(1);
  const [salaOpacity, setSalaOpacity] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hintVisible, setHintVisible] = useState(true);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [canvasCssH, setCanvasCssH] = useState(420);
  const [storyOverlay, setStoryOverlay] = useState<{
    id: string;
    formato: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const activeKnotRef = useRef(-1);
  const unraveledRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);

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

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = containerRef.current;
    if (!canvas || !wrap || phase === 'portal') return;

    const rect = wrap.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W < 2 || H < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    const knots = kpos(W, H, t, stories.length);
    const mouse = mouseRef.current;
    const unraveled = unraveledRef.current;

    let active = -1;
    for (let i = 0; i < knots.length; i++) {
      const { x, y } = knots[i];
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      if (Math.hypot(dx, dy) < 32) active = i;
    }
    activeKnotRef.current = active;

    const step = 3;
    const pts: { x: number; y: number }[] = [];
    for (let x = 0; x <= W; x += step) {
      pts.push({ x, y: ty(x, W, H, t) });
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const openThread = (dy: number) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (i === 0) ctx.moveTo(p.x, p.y + dy);
        else ctx.lineTo(p.x, p.y + dy);
      }
    };

    openThread(3.2);
    ctx.strokeStyle = 'rgba(55,65,82,0.09)';
    ctx.lineWidth = 6;
    ctx.stroke();

    openThread(1.6);
    ctx.strokeStyle = 'rgba(88,98,115,0.38)';
    ctx.lineWidth = 3.4;
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(200,205,215,0.35)');
    grad.addColorStop(0.1, 'rgba(135,145,162,0.95)');
    grad.addColorStop(0.5, 'rgba(95,105,125,1)');
    grad.addColorStop(0.9, 'rgba(135,145,162,0.95)');
    grad.addColorStop(1, 'rgba(200,205,215,0.35)');
    openThread(0);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.1;
    ctx.stroke();

    openThread(-1);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.15;
    ctx.stroke();

    for (let i = 0; i < knots.length; i++) {
      const { x, y } = knots[i];
      const isUnraveled = unraveled.has(i);
      const isHover = active === i && !isUnraveled;

      if (isUnraveled) {
        drawKnotSphere(ctx, x, y, 12, 'done');
        ctx.strokeStyle = 'rgba(140,150,165,0.55)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillStyle = ACCENT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', x, y);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        continue;
      }

      if (isHover) {
        const r = 18;
        ctx.beginPath();
        ctx.arc(x, y, r + 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,74,28,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,74,28,0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();

        drawKnotSphere(ctx, x, y, r, 'hover');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,74,28,0.55)';
        ctx.lineWidth = 2.25;
        ctx.stroke();

        ctx.font = '800 14px system-ui, sans-serif';
        ctx.fillStyle = ACCENT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255,74,28,0.2)';
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.fillText(String(i + 1), x, y);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        const h = stories[i];
        ctx.font = '700 20px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        let title = h.titulo;
        let tw = ctx.measureText(title).width;
        while (tw > W * 0.42 && title.length > 4) {
          title = title.slice(0, -1);
          tw = ctx.measureText(`${title}…`).width;
        }
        if (title !== h.titulo) title = `${title}…`;
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.shadowColor = 'rgba(100,110,130,0.22)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
        ctx.fillText(title, x, y - r - 22);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.font = '500 13px system-ui, sans-serif';
        ctx.fillStyle = ACCENT;
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(255,74,28,0.15)';
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.fillText(h.formato.toUpperCase(), x, y - r - 3);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        continue;
      }

      const rn = 13;
      drawKnotSphere(ctx, x, y, rn, 'idle');
      ctx.strokeStyle = 'rgba(160,170,185,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, rn, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillStyle = '#5a6578';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,255,255,0.55)';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = -0.5;
      ctx.shadowBlur = 0;
      ctx.fillText(String(i + 1), x, y);
      ctx.shadowColor = 'transparent';

      const sub = truncThreeWords(stories[i].titulo);
      ctx.font = '400 14px system-ui, sans-serif';
      ctx.fillStyle = TEXT_MUTED;
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(100,110,130,0.12)';
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 3;
      ctx.fillText(sub, x, y + 20);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }, [phase, stories]);

  useEffect(() => {
    if (phase === 'portal') return;

    const loop = () => {
      tRef.current += 0.01;
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

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setPointerFromClient(e.clientX, e.clientY);
  };

  const onCanvasMouseLeave = () => {
    mouseRef.current = { x: -9999, y: -9999 };
  };

  const navigateToHistoriaFromKnot = useCallback(
    (k: number) => {
      if (k < 0 || k >= stories.length || unraveledRef.current.has(k)) return;
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
      const s = stories[k];
      const formato = s.formato || 'video';
      setHintVisible(false);
      setStoryOverlay({ id: s.id, formato });
    },
    [stories, appendParticles]
  );

  const onCanvasClick = () => {
    drawFrame();
    navigateToHistoriaFromKnot(activeKnotRef.current);
  };

  const onCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const tch = e.touches[0];
    if (!tch) return;
    e.preventDefault();
    setPointerFromClient(tch.clientX, tch.clientY);
    drawFrame();
    navigateToHistoriaFromKnot(activeKnotRef.current);
  };

  const enterSala = () => {
    setPortalOpacity(0);
    window.setTimeout(() => {
      setPhase('hilo');
      setPortalOpacity(1);
    }, 700);
  };

  const exitToPortal = () => {
    setSalaOpacity(0);
    window.setTimeout(() => {
      setPhase('portal');
      unraveledRef.current = new Set();
      setDiscoveredCount(0);
      setHintVisible(true);
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: BG,
        color: TEXT_PRIMARY,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {styleTag}

      {phase === 'portal' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 60px',
            minHeight: '100vh',
            boxSizing: 'border-box',
            opacity: portalOpacity,
            transition: 'opacity 0.7s ease',
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: ACCENT,
              margin: 0,
              marginBottom: 18,
            }}
          >
            SALA · MUESTRA CURADA
          </p>
          <div
            style={{
              marginBottom: 14,
              maxWidth: 720,
              width: '100%',
              padding: 'clamp(18px, 4vw, 28px) clamp(20px, 5vw, 40px)',
              borderRadius: 28,
              backgroundColor: TITLE_NEU_BG,
              boxShadow: TITLE_NEU_SHADOW,
              border: '1px solid rgba(255, 255, 255, 0.58)',
              boxSizing: 'border-box',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 7vw, 3.875rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: TEXT_PRIMARY,
                textShadow:
                  '1px 1px 0 rgba(255, 255, 255, 0.95), -1px -1px 0 rgba(163, 177, 198, 0.28)',
              }}
            >
              {muestra.titulo}
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              marginBottom: 14,
              fontSize: 13,
              color: TEXT_MUTED,
            }}
          >
            Curadas por {muestra.curadora}
          </p>
          <p
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 16,
              color: TEXT_SECONDARY,
              lineHeight: 1.75,
              maxWidth: 480,
              whiteSpace: 'pre-wrap',
            }}
          >
            {muestra.descripcion}
          </p>
          <p
            style={{
              margin: 0,
              marginBottom: 40,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: TEXT_HINT,
            }}
          >
            {total} historias
          </p>
          <button
            type="button"
            onClick={enterSala}
            style={{
              alignSelf: 'flex-start',
              background: BG,
              color: ACCENT,
              border: 'none',
              padding: '15px 36px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: `6px 6px 12px ${SHADOW_DARK}, -6px -6px 12px ${SHADOW_LIGHT}`,
              cursor: 'pointer',
            }}
          >
            Entrar a la sala →
          </button>
        </div>
      )}

      {phase === 'hilo' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            minHeight: '100vh',
            backgroundColor: 'transparent',
            overflow: 'hidden',
            opacity: salaOpacity,
            transition: 'opacity 0.7s ease',
          }}
        >
          <LiquidLightBackground />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
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
            style={{
              width: '100%',
              height: canvasCssH,
              minHeight: 420,
              margin: '0 auto',
              marginTop: 72,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={onCanvasMouseMove}
              onMouseLeave={onCanvasMouseLeave}
              onClick={onCanvasClick}
              onTouchStart={onCanvasTouchStart}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
                touchAction: 'none',
                backgroundColor: 'transparent',
                position: 'relative',
                zIndex: 1,
              }}
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
              position: 'absolute',
              bottom: 22,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 8,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: TEXT_HINT,
              margin: 0,
              opacity: hintVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              textAlign: 'center',
              maxWidth: '90%',
            }}
          >
            toca un nudo para entrar a la historia
          </p>
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
    </div>
  );
}
