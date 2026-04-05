'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MuestrasSalaEntranceLink } from '@/components/muestras/MuestrasSalaEntranceLink';
import { MUESTRAS_CINEMATIC_BACKDROP_SRC } from '@/lib/muestras-cinematic-bg';
import { getGlassCarouselSlides } from '@/lib/muestras-glass-carousel';
import { CINEMATIC_BRAND } from './panels.data';
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
  const slides = getGlassCarouselSlides();
  const last = slides.length - 1;
  const { containerRef, progressRef, webglOn, reduceMotion, uiIndex, goToIndex } =
    useCinematicDeck();
  const [backdropFailed, setBackdropFailed] = useState(false);

  const windMouseLayerRefs = useRef<(HTMLDivElement | null)[]>([]);
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
      mouseXNormRef.current = e.clientX / Math.max(window.innerWidth, 1);
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

            <div className={styles.glassCarouselStage}>
              <div className={styles.glassCircle}>
                <div className={styles.glassSlideViewport}>
                  <div
                    ref={containerRef}
                    className={styles.muestrasSlider}
                    data-cinematic-slider
                  >
                    {slides.map((slide, i) => (
                      <div
                        key={slide.slug}
                        className={styles.muestraPanel}
                        data-muestra-panel
                        role="tabpanel"
                        id={`muestra-glass-panel-${i}`}
                        aria-labelledby={`muestra-glass-tab-${i}`}
                      >
                        <p className={styles.glassEyebrow}>
                          MUESTRA {slide.index1Based} DE {slides.length} · {slide.temaLabel}
                        </p>
                        <h2 className={styles.glassTitle}>{slide.title}</h2>
                        <p className={styles.glassDesc}>{slide.description}</p>
                        <div className={styles.glassSep} aria-hidden />
                        <ul className={styles.glassStoryList}>
                          {slide.storyTitles.map((t) => (
                            <li key={`${slide.slug}-${t}`}>{t}</li>
                          ))}
                        </ul>
                        <MuestrasSalaEntranceLink
                          href={`/muestras/${slide.slug}`}
                          className={styles.glassCta}
                        >
                          Entrar a la sala →
                        </MuestrasSalaEntranceLink>
                        {i === last ? (
                          <p className={styles.glassFooterLinks}>
                            <Link href="/" className={styles.glassFooterLink}>
                              Inicio
                            </Link>
                            {' · '}
                            <Link href="/muestras?list=1" className={styles.glassFooterLink}>
                              Muestras (listado)
                            </Link>
                            {' · '}
                            <Link href="/historias" className={styles.glassFooterLink}>
                              Historias
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={styles.glassDotsRow}
                  role="tablist"
                  aria-label="Muestras"
                >
                  {slides.map((p, i) => (
                    <button
                      key={p.slug}
                      type="button"
                      role="tab"
                      id={`muestra-glass-tab-${i}`}
                      aria-controls={`muestra-glass-panel-${i}`}
                      aria-label={`${p.title}, muestra ${i + 1} de ${slides.length}`}
                      aria-selected={i === uiIndex}
                      className={`${styles.glassDot} ${i === uiIndex ? styles.glassDotActive : ''}`}
                      onClick={() => goToIndex(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
