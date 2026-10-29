'use client';

import { INTERIOR_FONT_STACK } from '@/lib/typography';
import { neu } from '@/lib/historias-neumorph';
import { ShareAfterNotice } from '@/components/stories/ShareAfterNotice';
import { HistoriaCreditos } from '@/components/historia/HistoriaCreditos';
import { SimilarStories } from '@/components/mapa/SimilarStories';
import { StoryScrollBlock } from '@/components/historia/StoryScrollBlock';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { interpolate } from '@/lib/i18n/locale';
import { RespondeALine } from '@/components/historia/RespondeALine';

const CREAM = 'rgba(245,240,232,0.85)';
const CREAM_SOFT = 'rgba(245,240,232,0.7)';
const CREAM_MUTED = 'rgba(245,240,232,0.5)';
const SEPIA = '#FF4A1C';
const DEFAULT_BG = '#1a1410';

export interface HistoriaFoto {
  id: string;
  titulo: string;
  subtitulo?: string;
  fecha: string;
  imagenes: { url: string; caption?: string; descripcion?: string; titulo?: string; anio?: string; anioAprox?: boolean; lugar?: string }[];
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
  };
  tags?: string[];
  cancionRelacionada?: string;
  antecedentes?: string;
  questionId?: string;
  questionMode?: 'tu' | 'alguien';
}

interface FotoAlbumProps {
  historia: HistoriaFoto;
  onClose?: () => void;
  /** Ruta dedicada: sin barra superior propia; usa `GlobalSiteChrome`. */
  siteLayout?: boolean;
}

function extractColor(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(DEFAULT_BG);
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const factor = 0.25;
      resolve(`rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`);
    };
    img.onerror = () => resolve(DEFAULT_BG);
    img.src = imgUrl;
  });
}

export default function FotoAlbum({ historia, onClose, siteLayout = false }: FotoAlbumProps) {
  const { imagenes } = historia;
  const { t } = useHomeLocale();
  const fichaCaption = useCallback(
    (img: HistoriaFoto['imagenes'][number]) => {
      const when = img.anio?.trim()
        ? img.anioAprox
          ? interpolate(t.modalPhotoDecadeOption, { year: img.anio.trim() })
          : img.anio.trim()
        : '';
      const bits = [img.titulo?.trim(), when, img.lugar?.trim()].filter(Boolean);
      if (bits.length) return bits.join(' · ');
      return img.caption?.trim() ?? '';
    },
    [t.modalPhotoDecadeOption]
  );
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [fotoActivaIdx, setFotoActivaIdx] = useState(0);
  const [caption, setCaption] = useState(imagenes[0]?.caption ?? '');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const check = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (imagenes[fotoActivaIdx]) {
      extractColor(imagenes[fotoActivaIdx].url).then(setBgColor);
      queueMicrotask(() => setCaption(imagenes[fotoActivaIdx].caption ?? ''));
    }
  }, [fotoActivaIdx, imagenes]);

  const scrollToPhoto = useCallback((i: number) => {
    const next = Math.max(0, Math.min(imagenes.length - 1, i));
    sectionRefs.current[next]?.scrollIntoView({ behavior: 'smooth' });
  }, [imagenes.length]);

  const photoAlt = useCallback(
    (img: HistoriaFoto['imagenes'][number]) =>
      img.descripcion?.trim() ||
      fichaCaption(img) ||
      `Fotografía de ${historia.titulo}`,
    [fichaCaption, historia.titulo]
  );

  const photoAriaLabel = useCallback(
    (img: HistoriaFoto['imagenes'][number]) =>
      img.descripcion?.trim() || fichaCaption(img) || `Foto del álbum: ${historia.titulo}`,
    [fichaCaption, historia.titulo]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = sectionRefs.current.indexOf(entry.target as HTMLElement);
          if (i >= 0 && i < imagenes.length) setFotoActivaIdx(i);
        });
      },
      { threshold: 0.6, rootMargin: '0px' }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [imagenes.length]);

  const sectionHeight = isMobile ? '120vw' : isTablet ? '80vh' : '85vh';
  const isDesktop = !isMobile && !isTablet;

  return (
    <>
      <div
        style={{
          background: bgColor,
          minHeight: siteLayout ? undefined : '100vh',
          width: '100%',
          transition: 'background 0.8s ease' }}
      >
        {/* Header fijo (solo en modal / vista sin masthead global) */}
        {!siteLayout ? (
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            zIndex: 100,
            background: bgColor.startsWith('rgb') ? bgColor.replace(/^rgb\(/, 'rgba(').replace(/\)$/, ', 0.85)') : bgColor,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '1.25rem',
            paddingRight: '1.25rem' }}
        >
          <div>
            {onClose && (
              <button
                type="button"
                className="btn-am-neutro"
                onClick={onClose}
                style={{
                  fontFamily: INTERIOR_FONT_STACK,
                  fontWeight: 400,
                  fontSize: 'var(--fs-etiqueta)',
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                ← Volver
              </button>
            )}
          </div>
          <div style={{ display: isDesktop ? 'block' : 'none', fontFamily: INTERIOR_FONT_STACK, fontStyle: 'italic', fontSize: 'var(--fs-pequeno)', color: CREAM, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {historia.titulo}
          </div>
          <div style={{ fontFamily: INTERIOR_FONT_STACK, fontWeight: 400, fontSize: 'var(--fs-etiqueta)', color: CREAM_MUTED }}>
            {fotoActivaIdx + 1} / {imagenes.length}
          </div>
        </header>
        ) : null}

        {/* Scroll container */}
        <div
          style={{
            overflowY: 'auto',
            height: siteLayout ? undefined : '100vh',
            minHeight: siteLayout ? 'min(88dvh, 48rem)' : undefined,
            paddingTop: siteLayout ? 0 : 56 }}
        >
          <StoryScrollBlock scene>
            <section
              style={{
                minHeight: 'min(72dvh, 40rem)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 'clamp(2rem, 5vw, 3.5rem) 1.25rem 1.5rem' }}
            >
              <RespondeALine
                questionId={historia.questionId}
                questionMode={historia.questionMode}
                align="center"
                color={CREAM_SOFT}
              />
              <h1
                style={{
                  fontFamily: INTERIOR_FONT_STACK,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'var(--fs-titular)',
                  color: CREAM,
                  margin: '0 0 1rem',
                  lineHeight: 1.2 }}
              >
                {historia.titulo}
              </h1>
              <HistoriaCreditos
                nombre={historia.autor.nombre}
                ubicacion={historia.autor.ubicacion}
                tone="dark"
              />
            </section>
          </StoryScrollBlock>
          {imagenes.map((img, i) => (
            <section
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              style={{
                width: '100%',
                height: sectionHeight,
                minHeight: sectionHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative' }}
            >
              {isDesktop ? (
                <div
                  role="figure"
                  aria-label={photoAriaLabel(img)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    width: 'min(75vw, 900px)',
                    height: 'calc(85vh - 80px)' }}
                >
                  <img
                    src={img.url}
                    alt={photoAlt(img)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      background: 'var(--home-bg)' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      boxShadow: 'inset 0 0 0 14px rgba(255,255,255,0.92), inset 0 0 0 15px rgba(200,190,170,0.3)',
                      pointerEvents: 'none' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 64,
                      background: 'rgba(255,255,255,0.92)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center' }}
                  >
                    {fotoActivaIdx === i && (
                      <p
                        style={{
                          fontFamily: INTERIOR_FONT_STACK,
                          fontWeight: 400,
                          fontSize: 'var(--fs-etiqueta)',
                          color: '#3a3028',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '0 16px',
                          margin: 0 }}
                      >
                        {fichaCaption(img)}
                      </p>
                    )}
                  </div>
                </div>
              ) : isTablet ? (
                <div style={{ width: '85%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    role="figure"
                    aria-label={photoAriaLabel(img)}
                    style={{ position: 'relative', overflow: 'hidden', width: '100%', height: 'calc(80vh - 100px)', maxWidth: 600 }}
                  >
                    <img
                      src={img.url}
                      alt={photoAlt(img)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      background: 'var(--home-bg)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 10px rgba(255,255,255,0.92)' }} />
                  </div>
                  {fichaCaption(img) ? (
                    <p style={{ fontFamily: INTERIOR_FONT_STACK, fontWeight: 400, fontSize: 'var(--fs-etiqueta)', color: CREAM_SOFT, marginTop: 12, padding: '0 16px', textAlign: 'center' }}>
                      {fichaCaption(img)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div
                  role="figure"
                  aria-label={photoAriaLabel(img)}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <img
                    src={img.url}
                    alt={photoAlt(img)}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'calc(100vw * 1.2 - 80px)',
                      objectFit: 'contain',
                      background: 'var(--home-bg)' }}
                  />
                  {fichaCaption(img) ? (
                    <p style={{ fontFamily: INTERIOR_FONT_STACK, fontWeight: 400, fontSize: 'var(--fs-etiqueta)', color: CREAM_SOFT, padding: '12px 20px', margin: 0, textAlign: 'center' }}>
                      {fichaCaption(img)}
                    </p>
                  ) : null}
                </div>
              )}
            </section>
          ))}

          {/* Cierre del álbum — mismo criterio neumórfico claro que audio/vídeo al terminar */}
          <StoryScrollBlock scene>
          <section
            style={{
              minHeight: 'min(72dvh, 40rem)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'clamp(2rem, 5vw, 3.25rem) 1.25rem',
              background: `linear-gradient(180deg, ${neu.bg} 0%, #dbe0e9 100%)`,
              fontFamily: INTERIOR_FONT_STACK }}
          >
            <div
              style={{
                ...neu.cardProminent,
                width: '100%',
                maxWidth: 520,
                padding: '2.25rem clamp(1.25rem, 4vw, 2.5rem)',
                borderRadius: 28,
                boxShadow: `${neu.cardProminent.boxShadow as string}, 0 36px 56px rgba(163,177,198,0.22)` }}
            >
              {imagenes.length > 0 ? (
                <p
                  style={{
                    fontSize: 'var(--fs-etiqueta)',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: neu.textBody,
                    marginBottom: '0.85rem' }}
                >
                  {imagenes.length} fotografías
                </p>
              ) : null}
              <RespondeALine
                questionId={historia.questionId}
                questionMode={historia.questionMode}
                align="center"
                color={neu.textBody}
              />
              <h2
                style={{
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 'var(--fs-titular)',
                  color: neu.textMain,
                  marginBottom: '1.25rem',
                  lineHeight: 1.2 }}
              >
                {historia.titulo}
              </h2>
              <div style={{ width: 48, height: 2, background: `${SEPIA}45`, margin: '0 auto 1.35rem', borderRadius: 999 }} />
              <img
                src={historia.autor.avatar}
                alt={`Retrato de ${historia.autor.nombre}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${SEPIA}55`,
                  marginBottom: '0.85rem',
                  boxShadow: '8px 8px 14px rgba(163,177,198,0.4), -4px -4px 10px rgba(255,255,255,0.75)' }}
              />
              <HistoriaCreditos
                cancionRelacionada={historia.cancionRelacionada}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      ...neu.button,
                      fontFamily: INTERIOR_FONT_STACK,
                      fontWeight: 600,
                      fontSize: 'var(--fs-etiqueta)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '0.85rem 1.35rem',
                      color: neu.textMain,
                      cursor: 'pointer',
                      borderRadius: 999,
                      boxShadow: `${String(neu.button.boxShadow)}, inset 0 1px 0 rgba(255,255,255,0.75)` }}
                  >
                    ← Ver más historias
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-am-secundario"
                  onClick={() => setShareOpen(true)}
                  style={{
                    fontFamily: INTERIOR_FONT_STACK,
                    fontWeight: 700,
                    fontSize: 'var(--fs-etiqueta)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '0.85rem 1.35rem' }}
                >
                  Compartir
                </button>
              </div>
            </div>
            <div style={{ width: '100%', maxWidth: 720, padding: '0 1.25rem' }}>
              <SimilarStories storyId={historia.id} variant="light" />
            </div>
          </section>
          </StoryScrollBlock>
        </div>

        {/* Indicador lateral (solo escritorio) */}
        {isDesktop && imagenes.length > 0 && (
          <div
            style={{
              position: 'fixed',
              right: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'center' }}
          >
            <button
              type="button"
              onClick={() => scrollToPhoto(fotoActivaIdx - 1)}
              disabled={fotoActivaIdx <= 0}
              aria-label="Foto anterior"
              style={{
                minHeight: 48,
                minWidth: 48,
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid rgba(245,240,232,0.45)',
                background: 'rgba(0,0,0,0.35)',
                color: CREAM,
                fontFamily: INTERIOR_FONT_STACK,
                fontSize: 'var(--fs-pequeno)',
                fontWeight: 500,
                cursor: fotoActivaIdx <= 0 ? 'not-allowed' : 'pointer',
                opacity: fotoActivaIdx <= 0 ? 0.45 : 1 }}
            >
              ← Ant.
            </button>
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToPhoto(i)}
                aria-label={`Ir a foto ${i + 1}`}
                style={{
                  width: 12,
                  height: fotoActivaIdx === i ? 44 : 12,
                  borderRadius: fotoActivaIdx === i ? 6 : 50,
                  background: fotoActivaIdx === i ? SEPIA : 'rgba(245,240,232,0.28)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s' }}
              />
            ))}
            <button
              type="button"
              onClick={() => scrollToPhoto(fotoActivaIdx + 1)}
              disabled={fotoActivaIdx >= imagenes.length - 1}
              aria-label="Foto siguiente"
              style={{
                minHeight: 48,
                minWidth: 48,
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid rgba(245,240,232,0.45)',
                background: 'rgba(0,0,0,0.35)',
                color: CREAM,
                fontFamily: INTERIOR_FONT_STACK,
                fontSize: 'var(--fs-pequeno)',
                fontWeight: 500,
                cursor: fotoActivaIdx >= imagenes.length - 1 ? 'not-allowed' : 'pointer',
                opacity: fotoActivaIdx >= imagenes.length - 1 ? 0.45 : 1 }}
            >
              Sig. →
            </button>
          </div>
        )}
      </div>
      <ShareAfterNotice
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        kind="story"
        storyId={historia.id}
        title={historia.titulo}
        city={historia.autor.ubicacion ?? ''}
        format="photo"
      />
    </>
  );
}
