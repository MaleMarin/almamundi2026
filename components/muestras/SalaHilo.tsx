'use client';

/**
 * Sala «el hilo» — portal neumórfico → canvas (hilo + nudos) → card de historia.
 * Estilos solo inline + keyframes locales (sin Tailwind ni CSS module).
 */
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

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

type Particle = {
  id: string;
  left: number;
  top: number;
  tx: number;
  ty: number;
  size: number;
};

type Phase = 'portal' | 'hilo' | 'story';

const BG = '#e6e9ee';
const ACCENT = '#FF4A1C';
const TEXT_PRIMARY = '#1a1f2a';
const TEXT_SECONDARY = '#5a6070';
const TEXT_MUTED = '#9299a8';
const TEXT_HINT = '#b0b6c2';
const SHADOW_DARK = '#c4c7cd';
const SHADOW_LIGHT = '#ffffff';

export function SalaHilo({ muestra }: { muestra: SalaHiloMuestraInput }) {
  const uid = useId().replace(/:/g, '');
  const stories = muestra.historias;
  const total = stories.length;

  const [phase, setPhase] = useState<Phase>('portal');
  const [portalOpacity, setPortalOpacity] = useState(1);
  const [salaOpacity, setSalaOpacity] = useState(1);
  const [storyIndex, setStoryIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hintVisible, setHintVisible] = useState(true);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [canvasCssH, setCanvasCssH] = useState(420);

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
    if (!canvas || !wrap || phase === 'portal' || phase === 'story') return;

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
      if (Math.hypot(dx, dy) < 26) active = i;
    }
    activeKnotRef.current = active;

    const step = 3;
    const pts: { x: number; y: number }[] = [];
    for (let x = 0; x <= W; x += step) {
      pts.push({ x, y: ty(x, W, H, t) });
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y + 2);
      else ctx.lineTo(p.x, p.y + 2);
    }
    ctx.strokeStyle = 'rgba(180,185,195,0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(200,205,215,0.3)');
    grad.addColorStop(0.1, 'rgba(150,160,175,0.9)');
    grad.addColorStop(0.5, 'rgba(120,130,148,1)');
    grad.addColorStop(0.9, 'rgba(150,160,175,0.9)');
    grad.addColorStop(1, 'rgba(200,205,215,0.3)');
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    for (let i = 0; i < knots.length; i++) {
      const { x, y } = knots[i];
      const isUnraveled = unraveled.has(i);
      const isHover = active === i && !isUnraveled;

      if (isUnraveled) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#dde0e6';
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,185,195,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillStyle = ACCENT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', x, y);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        continue;
      }

      if (isHover) {
        const r = 15;
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

        ctx.beginPath();
        ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,185,195,0.7)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 1.5, y - 1.5, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = BG;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,74,28,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '800 11px system-ui, sans-serif';
        ctx.fillStyle = ACCENT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x, y);

        const h = stories[i];
        ctx.font = '700 16px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        let title = h.titulo;
        let tw = ctx.measureText(title).width;
        while (tw > W * 0.35 && title.length > 4) {
          title = title.slice(0, -1);
          tw = ctx.measureText(`${title}…`).width;
        }
        if (title !== h.titulo) title = `${title}…`;
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.shadowColor = SHADOW_LIGHT;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 0;
        ctx.fillText(title, x, y - r - 18);
        ctx.shadowColor = 'transparent';

        ctx.font = '500 11px system-ui, sans-serif';
        ctx.fillStyle = ACCENT;
        ctx.textBaseline = 'bottom';
        ctx.fillText(h.formato.toUpperCase(), x, y - r - 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        continue;
      }

      const rn = 10;
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, rn, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,185,195,0.5)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 1.5, y - 1.5, rn, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, rn, 0, Math.PI * 2);
      ctx.fillStyle = '#e8eaed';
      ctx.fill();

      ctx.font = '600 9px system-ui, sans-serif';
      ctx.fillStyle = '#7a8292';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y);

      const sub = truncThreeWords(stories[i].titulo);
      ctx.font = '400 11px system-ui, sans-serif';
      ctx.fillStyle = TEXT_MUTED;
      ctx.textBaseline = 'top';
      ctx.fillText(sub, x, y + 16);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }, [phase, stories]);

  useEffect(() => {
    if (phase === 'portal' || phase === 'story') return;

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

  const openStory = (k: number) => {
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
    setStoryIndex(k);
    setPhase('story');
    setHintVisible(false);
  };

  const onCanvasClick = () => {
    drawFrame();
    openStory(activeKnotRef.current);
  };

  const onCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const tch = e.touches[0];
    if (!tch) return;
    e.preventDefault();
    setPointerFromClient(tch.clientX, tch.clientY);
    drawFrame();
    openStory(activeKnotRef.current);
  };

  const closeStory = useCallback(() => {
    setPhase('hilo');
  }, []);

  useEffect(() => {
    if (phase !== 'story') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeStory();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, closeStory]);

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
      setStoryIndex(0);
      setSalaOpacity(1);
    }, 700);
  };

  const current = stories[storyIndex];

  const styleTag = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes salaHiloParticle_${uid} {
  from { opacity: 0.7; transform: translate(0,0) scale(1); }
  to { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.1); }
}
@keyframes salaCardSlide_${uid} {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes salaCardTitle_${uid} {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes salaCardQuote_${uid} {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes salaCardFade_${uid} {
  from { opacity: 0; }
  to { opacity: 1; }
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
          <h1
            style={{
              margin: 0,
              marginBottom: 14,
              fontSize: 62,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              color: TEXT_PRIMARY,
              maxWidth: 620,
            }}
          >
            {muestra.titulo}
          </h1>
          <p
            style={{
              margin: 0,
              marginBottom: 14,
              fontSize: 13,
              color: TEXT_MUTED,
            }}
          >
            Curada por {muestra.curadora}
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

      {(phase === 'hilo' || phase === 'story') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            minHeight: '100vh',
            background: BG,
            overflow: 'hidden',
            opacity: salaOpacity,
            transition: 'opacity 0.7s ease',
          }}
        >
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
            acercate a un nudo para descubrir la historia
          </p>

          {phase === 'story' && current && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                animation: `salaCardSlide_${uid} 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              }}
            >
              <div
                style={{
                  margin: '0 28px 28px',
                  background: BG,
                  borderRadius: 24,
                  boxShadow: `12px 12px 24px ${SHADOW_DARK}, -12px -12px 24px ${SHADOW_LIGHT}`,
                  padding: '32px 36px 28px',
                  display: 'flex',
                  gap: 40,
                  alignItems: 'flex-end',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      color: ACCENT,
                      margin: '0 0 12px',
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
                    />
                    {current.formato.toUpperCase()}
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 36,
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      color: TEXT_PRIMARY,
                      animation: `salaCardTitle_${uid} 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both`,
                    }}
                  >
                    {current.titulo}
                  </h2>
                  <p
                    style={{
                      margin: '14px 0 0',
                      fontSize: 14,
                      fontStyle: 'italic',
                      color: '#7a8292',
                      lineHeight: 1.75,
                      animation: `salaCardQuote_${uid} 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both`,
                    }}
                  >
                    “{current.quote}”
                  </p>
                  <p
                    style={{
                      margin: '12px 0 0',
                      fontSize: 12,
                      color: TEXT_HINT,
                      letterSpacing: '0.04em',
                      animation: `salaCardFade_${uid} 0.5s ease 0.42s both`,
                    }}
                  >
                    {current.meta}
                  </p>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    animation: `salaCardFade_${uid} 0.5s ease 0.48s both`,
                  }}
                >
                  <Link
                    href={`/historias/${current.id}/${current.formato}`}
                    style={{
                      display: 'inline-block',
                      background: ACCENT,
                      color: '#ffffff',
                      border: 'none',
                      padding: '13px 28px',
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    Abrir esta historia
                  </Link>
                  <button
                    type="button"
                    onClick={closeStory}
                    style={{
                      background: BG,
                      color: TEXT_MUTED,
                      border: 'none',
                      padding: '13px 24px',
                      borderRadius: 100,
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      boxShadow: `3px 3px 7px ${SHADOW_DARK}, -3px -3px 7px ${SHADOW_LIGHT}`,
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
      )}
    </div>
  );
}
