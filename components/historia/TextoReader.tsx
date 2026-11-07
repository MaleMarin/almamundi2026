'use client';

import { useState, useEffect } from 'react';
import { formatPublishedAtEsStable } from '@/lib/historias/format-published-es-stable';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { INTERIOR_FONT_STACK } from '@/lib/typography';
import { ShareAfterNotice } from '@/components/stories/ShareAfterNotice';
import { CancionRelacionadaLine } from '@/components/historia/CancionRelacionadaLine';
import { StoryScrollBlock } from '@/components/historia/StoryScrollBlock';
import { SimilarStories } from '@/components/mapa/SimilarStories';
import { neu } from '@/lib/historias-neumorph';
import { RespondeALine } from '@/components/historia/RespondeALine';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { formatPagesCopy } from '@/lib/historias/format-pages-copy';

const PAPEL = '#faf8f4';
const TINTA = '#2a2218';
const TINTA_SOFT = '#4a3f32';
const SEPIA = '#FF4A1C';
const SEPIA_DK = '#FF4A1C';

export interface HistoriaTexto {
  id: string;
  titulo: string;
  subtitulo?: string;
  contenido: string;
  tiempoLectura?: number;
  fecha: string;
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
    bio?: string;
  };
  tags?: string[];
  cancionRelacionada?: string;
  antecedentes?: string;
  questionId?: string;
  questionMode?: 'tu' | 'alguien';
}

interface TextoReaderProps {
  historia: HistoriaTexto;
  onClose?: () => void;
  /** Ruta dedicada: barra de progreso bajo el masthead global. */
  siteLayout?: boolean;
}

function formatFecha(fecha: string, locale: AlmaLocale): string {
  if (!fecha) return '';
  const s = formatPublishedAtEsStable(fecha, locale);
  return s === '—' ? fecha : s;
}

function splitParrafos(contenido: string): string[] {
  const trimmed = contenido.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
}

export default function TextoReader({ historia, onClose, siteLayout = false }: TextoReaderProps) {
  const { locale } = useHomeLocale();
  const copy = formatPagesCopy(locale);
  const [isMobile, setIsMobile] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const parrafos = splitParrafos(historia.contenido);

  const maxWidth = isMobile ? '100%' : '640px';
  const maxWidthDesktop = '720px';
  const paddingX = isMobile ? 20 : 24;

  return (
    <>
      {/* Botón Volver */}
      {onClose && (
        <button
          type="button"
          className="btn-am-neutro"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: '1.2rem',
            left: '1.5rem',
            zIndex: 100,
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
          {isMobile ? '←' : copy.back}
        </button>
      )}

      {/* Contenedor principal */}
      <div
        role="article"
        aria-label={copy.storyAria(historia.titulo)}
        style={{
          background: PAPEL,
          minHeight: siteLayout ? 'min(88dvh, 48rem)' : '100vh',
          paddingTop: siteLayout ? '1.25rem' : '5rem',
          paddingBottom: '3rem',
          paddingLeft: paddingX,
          paddingRight: paddingX,
          maxWidth: isMobile ? '100%' : maxWidthDesktop,
          margin: '0 auto',
          boxSizing: 'border-box' }}
      >
        {/* Encabezado sin alto mínimo: el texto empieza justo después (sin hueco). */}
        <StoryScrollBlock>
        {/* Fecha */}
        <p
          style={{
            fontFamily: INTERIOR_FONT_STACK,
            fontWeight: 400,
            fontSize: 'var(--fs-etiqueta)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SEPIA,
            marginBottom: '1.5rem' }}
        >
          {formatFecha(historia.fecha, locale)}
        </p>

        {/* Título */}
        <RespondeALine questionId={historia.questionId} questionMode={historia.questionMode} color={TINTA_SOFT} />
        <h1
          style={{
            fontFamily: INTERIOR_FONT_STACK,
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: 'var(--fs-titular)',
            color: TINTA,
            lineHeight: 1.15,
            marginBottom: '0.8rem' }}
        >
          {historia.titulo}
        </h1>

        {/* Subtítulo */}
        {historia.subtitulo &&
          historia.subtitulo.trim().toLowerCase() !== historia.titulo.trim().toLowerCase() && (
          <p
            style={{
              fontFamily: INTERIOR_FONT_STACK,
              fontWeight: 400,
              fontSize: 'var(--fs-pequeno)',
              color: TINTA_SOFT,
              lineHeight: 1.7,
              marginBottom: '1.5rem' }}
          >
            {historia.subtitulo}
          </p>
        )}

        <div
          style={{
            width: 60,
            height: 1,
            background: `linear-gradient(90deg, ${SEPIA_DK}, transparent)`,
            marginBottom: '1.5rem' }}
        />

        {/* Metadatos: avatar + nombre + ubicación + tiempo */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            alignItems: 'center',
            marginBottom: '3rem' }}
        >
          <img
            src={historia.autor.avatar}
            alt={copy.portrait(historia.autor.nombre)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover' }}
          />
          <span style={{ fontFamily: INTERIOR_FONT_STACK, fontWeight: 400, fontSize: 'var(--fs-pequeno)', color: TINTA }}>
            {historia.autor.nombre}
          </span>
          {historia.autor.ubicacion ? (
            <>
              <span style={{ color: TINTA_SOFT, opacity: 0.7 }}>·</span>
              <span
                style={{
                  fontFamily: INTERIOR_FONT_STACK,
                  fontWeight: 400,
                  fontSize: 'var(--fs-etiqueta)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: TINTA_SOFT }}
              >
                {historia.autor.ubicacion}
              </span>
            </>
          ) : null}
        </div>
        </StoryScrollBlock>

        <StoryScrollBlock>
        {/* Cuerpo: párrafos separados por línea en blanco; salto simple = cambio de línea. */}
        <div lang="es">
          {parrafos.map((texto, i) => (
            <p
              key={i}
              style={{
                fontFamily: INTERIOR_FONT_STACK,
                fontSize: 'var(--fs-texto)',
                lineHeight: 1.6,
                color: TINTA,
                whiteSpace: 'pre-line',
                margin: '0 0 1rem' }}
            >
              {texto}
            </p>
          ))}
        </div>
        </StoryScrollBlock>

        <StoryScrollBlock>
        <div style={{ textAlign: 'left', marginTop: '1rem' }}>
          <CancionRelacionadaLine value={historia.cancionRelacionada} />
        </div>

        {/* Marca de cierre, igual a la línea bajo el título. */}
        <div
          aria-hidden
          style={{
            width: 60,
            height: 1,
            background: `linear-gradient(90deg, ${SEPIA_DK}, transparent)`,
            marginTop: '1.5rem' }}
        />

        {/* Navegación final */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '2rem' }}
        >
          {onClose && (
            <button
              type="button"
              className="btn-am-neutro"
              onClick={onClose}
              style={{
                fontFamily: INTERIOR_FONT_STACK,
                fontWeight: 600,
                fontSize: 'var(--fs-etiqueta)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '0.85rem 1.35rem' }}
            >
              {copy.backStories}
            </button>
          )}
          <button
            type="button"
            className="btn-am-secundario"
            onClick={() => setShareOpen(true)}
            style={{
              fontFamily: INTERIOR_FONT_STACK,
              fontWeight: 600,
              fontSize: 'var(--fs-etiqueta)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.85rem 1.35rem' }}
          >
            {copy.shareThisStory}
          </button>
        </div>

        {/* El autor aparece una sola vez, arriba (docs/decisiones-cerradas.md). */}
        <SimilarStories storyId={historia.id} variant="light" />
        </StoryScrollBlock>
      </div>
      <ShareAfterNotice
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        kind="story"
        storyId={historia.id}
        title={historia.titulo}
        city={historia.autor.ubicacion ?? ''}
        format="text"
      />
    </>
  );
}
