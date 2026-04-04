'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MUESTRAS_CINEMATIC_BACKDROP_SRC } from '@/lib/muestras-cinematic-bg';
import { CINEMATIC_BRAND, CINEMATIC_PANELS } from './panels.data';
import { useCinematicDeck } from './useCinematicDeck';
import styles from './cinematic.module.css';

const WebGLBackground = dynamic(
  () => import('@/components/immersive/WebGLBackground'),
  { ssr: false }
);

/** Columnas del fondo para ola tipo “viento” entre barras de color (solo si !reduceMotion). */
const CINEMATIC_WIND_STRIPS = 28;

/**
 * Puntero normalizado 0–1; empuje en px (gaussiana suave, más radical cerca del cursor).
 */
function stripMouseOffsetPx(
  stripIndex: number,
  stripCount: number,
  mouseXNorm: number | null,
  maxPx: number
): number {
  if (mouseXNorm == null) return 0;
  const cx = (stripIndex + 0.5) / stripCount;
  const d = mouseXNorm - cx;
  const sigma = 0.11;
  const gauss = Math.exp(-(d * d) / (2 * sigma * sigma));
  return d * maxPx * gauss * 4.2;
}

export type CinematicPageClientProps = {
  /** Destino del enlace «salir» (p. ej. `/muestras`). */
  exitHref?: string;
  exitLabel?: string;
};

export function CinematicPageClient({
  exitHref = '/muestras',
  exitLabel = 'Volver al listado',
}: CinematicPageClientProps) {
  const { containerRef, progressRef, webglOn, reduceMotion, uiIndex, goToIndex } =
    useCinematicDeck();
  const last = CINEMATIC_PANELS.length - 1;
  const [backdropFailed, setBackdropFailed] = useState(false);

  const windMouseLayerRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** null = sin puntero en el documento → sin empuje. */
  const mouseXNormRef = useRef<number | null>(null);
  const windMouseRafRef = useRef<number | null>(null);

  const applyWindMouseOffsets = useCallback(() => {
    const n = CINEMATIC_WIND_STRIPS;
    const mx = mouseXNormRef.current;
    const layers = windMouseLayerRefs.current;
    const maxPx = 48;
    for (let i = 0; i < n; i += 1) {
      const el = layers[i];
      if (!el) continue;
      const px = stripMouseOffsetPx(i, n, mx, maxPx);
      el.style.transform = `translate3d(${px}px, 0, 0)`;
    }
  }, []);

  const scheduleWindMouseUpdate = useCallback(() => {
    if (windMouseRafRef.current != null) return;
    windMouseRafRef.current = requestAnimationFrame(() => {
      windMouseRafRef.current = null;
      applyWindMouseOffsets();
    });
  }, [applyWindMouseOffsets]);

  useEffect(() => {
    if (reduceMotion || backdropFailed) return;

    const onPointerMove = (e: PointerEvent) => {
      mouseXNormRef.current =
        e.clientX / Math.max(window.innerWidth, 1);
      scheduleWindMouseUpdate();
    };

    const neutralize = () => {
      mouseXNormRef.current = null;
      scheduleWindMouseUpdate();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', neutralize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', neutralize);
      if (windMouseRafRef.current != null) {
        cancelAnimationFrame(windMouseRafRef.current);
        windMouseRafRef.current = null;
      }
    };
  }, [reduceMotion, backdropFailed, scheduleWindMouseUpdate]);

  return (
    <div className={styles.muestrasCinematicPage}>
    <section
      className={styles.heroRoot}
      data-cinematic-deck
      aria-label="Muestras — recorrido"
      aria-live="polite"
    >
      <div className={styles.cinematicStage}>
      {!backdropFailed ? (
        <div className={styles.sceneBackdropWrap}>
          {!reduceMotion ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- probe de error; mismo src que columnas */}
              <img
                src={MUESTRAS_CINEMATIC_BACKDROP_SRC}
                alt=""
                className={styles.backdropProbe}
                onError={() => setBackdropFailed(true)}
              />
              <div className={styles.windStripsRoot} aria-hidden>
                {Array.from({ length: CINEMATIC_WIND_STRIPS }, (_, i) => {
                  const n = CINEMATIC_WIND_STRIPS;
                  const posX = n > 1 ? (i / (n - 1)) * 100 : 50;
                  return (
                    <div key={i} className={styles.windStripCol}>
                      <div
                        className={styles.windStripSway}
                        style={{ animationDelay: `${i * 0.09}s` }}
                      >
                        <div
                          ref={(el) => {
                            windMouseLayerRefs.current[i] = el;
                          }}
                          className={styles.windStripMouse}
                          style={{
                            backgroundImage: `url(${MUESTRAS_CINEMATIC_BACKDROP_SRC})`,
                            backgroundSize: `${n * 100}% 108%`,
                            backgroundPosition: `${posX}% 40%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Image
              src={MUESTRAS_CINEMATIC_BACKDROP_SRC}
              alt=""
              fill
              sizes="100vw"
              className={styles.sceneBackdropImg}
              priority
              unoptimized
              onError={() => setBackdropFailed(true)}
            />
          )}
        </div>
      ) : null}
      <div className={styles.cinematicEnvLayer}>
        {webglOn ? (
          <WebGLBackground progressRef={progressRef} showSphere={false} />
        ) : (
          <div
            className={`${styles.fallbackBg} ${!reduceMotion ? styles.fallbackBgMotion : ''}`}
            aria-hidden
          />
        )}
      </div>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <Link href="/" className={styles.brand}>
            {CINEMATIC_BRAND}
          </Link>
          <Link href={exitHref} className={styles.exit}>
            {exitLabel}
          </Link>
        </header>
        <div ref={containerRef} className={styles.deck}>
          {CINEMATIC_PANELS.map((block, i) => (
            <section
              key={block.slug}
              className={styles.panel}
              data-cinematic-panel
              aria-hidden={i !== uiIndex}
            >
              <div
                className={`${styles.panelInner} ${styles.glassPanel}`}
                data-cinematic-glass-scroll
              >
                <p className={styles.kicker} data-cinematic-animate>
                  {block.kicker}
                </p>
                <h1 className={styles.title} data-cinematic-animate>
                  {block.title}
                </h1>
                <p className={styles.body} data-cinematic-animate>
                  {block.body}
                </p>
                {block.pieceTitles.length > 0 ? (
                  <ul className={styles.pieceNames} data-cinematic-animate>
                    {block.pieceTitles.map((pieceTitle, idx) => (
                      <li key={`${block.slug}-${idx}-${pieceTitle}`}>
                        {pieceTitle}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div data-cinematic-animate>
                  <Link
                    href={`/muestras/${block.slug}`}
                    className={styles.salaLink}
                  >
                    Entrar a la sala →
                  </Link>
                </div>
                {i === last ? (
                  <p
                    className={styles.body}
                    data-cinematic-animate
                    style={{ marginTop: '1.5rem' }}
                  >
                    <Link href="/" className={styles.brand}>
                      Inicio
                    </Link>
                    {' · '}
                    <Link href="/muestras?list=1" className={styles.brand}>
                      Muestras (listado)
                    </Link>
                    {' · '}
                    <Link href="/historias" className={styles.brand}>
                      Historias
                    </Link>
                  </p>
                ) : null}
                {!reduceMotion ? (
                  <p
                    className={styles.hintInGlass}
                    data-cinematic-animate
                    aria-hidden
                  >
                    Desliza dentro del círculo para leer · en la última tarjeta,
                    al final del texto, baja para el pie de página
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
        <div className={styles.dots} role="tablist" aria-label="Muestras">
          {CINEMATIC_PANELS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              aria-label={`${p.title}, muestra ${i + 1} de ${CINEMATIC_PANELS.length}`}
              aria-selected={i === uiIndex}
              className={`${styles.dot} ${i === uiIndex ? styles.dotActive : ''}`}
              onClick={() => goToIndex(i)}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
    </div>
  );
}
