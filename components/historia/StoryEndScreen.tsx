'use client';

import type { CSSProperties } from 'react';
import { DemoStoryDisclosure } from '@/components/stories/DemoStoryDisclosure';
import type { DemoStoryFields } from '@/lib/demo-stories-public';
import { neu } from '@/lib/historias-neumorph';
import { formatPublishedAtEsStable } from '@/lib/historias/format-published-es-stable';
import { SITE_FONT_STACK } from '@/lib/typography';

export type StoryEndAutor = {
  nombre: string;
  avatar: string;
  ubicacion?: string;
  bio?: string;
};

export type StoryEndScreenProps = {
  titulo: string;
  subtitulo?: string;
  fecha?: string;
  citaDestacada?: string;
  autor: StoryEndAutor;
  tags?: string[];
  replayLabel: string;
  onReplay: () => void;
  onMoreStories: () => void;
  thumbnailUrl?: string;
  demoStory?: DemoStoryFields;
  /** Incrustado bajo el layout global: no usa overlay `fixed` a pantalla completa. */
  embedInSite?: boolean;
};

const TEXT_TITLE = neu.textMain;
const TEXT_BODY = neu.textBody;
const ORANGE = 'var(--almamundi-orange, #ff4500)';
const SOFT_ORANGE_SHADOW = `0 22px 48px rgba(255,69,0,0.18), inset 0 -1px 0 rgba(163,177,198,0.25)`;

function formatEndFecha(raw: string | undefined): string | null {
  if (!raw || !String(raw).trim()) return null;
  const s = formatPublishedAtEsStable(String(raw));
  return s === '—' ? String(raw).trim() : s;
}

/**
 * Pantalla de cierre al terminar historia (audio / vídeo): fondo neumórfico claro, tarjeta central y CTAs coherentes con AlmaMundi.
 * Solo presentación; la lógica vive en el reproductor.
 */
export function StoryEndScreen({
  titulo,
  subtitulo,
  fecha,
  citaDestacada,
  autor,
  tags,
  replayLabel,
  onReplay,
  onMoreStories,
  thumbnailUrl,
  demoStory,
  embedInSite = false,
}: StoryEndScreenProps) {
  const fechaStr = formatEndFecha(fecha);

  const hasTitleExtras = Boolean(subtitulo?.trim()) || Boolean(fechaStr);

  const shellStyle: CSSProperties = embedInSite
    ? {
        position: 'relative',
        minHeight: 'min(92dvh, 56rem)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        zIndex: 1,
        fontFamily: SITE_FONT_STACK,
        WebkitOverflowScrolling: 'touch',
        padding: '1.25rem',
        backgroundColor: neu.bg,
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,74,28,0.085) 0%, transparent 55%),
          radial-gradient(ellipse 90% 60% at 100% 100%, rgba(163,177,198,0.22) 0%, transparent 50%),
          linear-gradient(180deg, ${neu.bg} 0%, #dbe0e9 100%)
        `,
      }
    : {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        zIndex: 10001,
        fontFamily: SITE_FONT_STACK,
        WebkitOverflowScrolling: 'touch',
        padding: '1.25rem',
        backgroundColor: neu.bg,
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,74,28,0.085) 0%, transparent 55%),
          radial-gradient(ellipse 90% 60% at 100% 100%, rgba(163,177,198,0.22) 0%, transparent 50%),
          linear-gradient(180deg, ${neu.bg} 0%, #dbe0e9 100%)
        `,
      };

  return (
    <div
      style={shellStyle}
      data-story-end-screen
    >
      {thumbnailUrl ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '-8%',
            backgroundImage: `url(${thumbnailUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
            filter: 'blur(64px) saturate(1.15) brightness(1.06)',
            transform: 'scale(1.05)',
          }}
        />
      ) : null}

      <div
        className="story-end-reveal"
        style={{
          ...neu.cardProminent,
          zIndex: 2,
          width: '100%',
          maxWidth: 'min(560px, 100%)',
          padding: '2.65rem clamp(1.35rem, 4vw, 2.85rem)',
          borderRadius: 28,
          textAlign: 'center',
          boxShadow: `${neu.cardProminent.boxShadow as string}, 0 38px 64px rgba(163,177,198,0.26)`,
        }}
      >
        {demoStory ? (
          <div style={{ marginBottom: '1.35rem', textAlign: 'left' }}>
            <DemoStoryDisclosure story={demoStory} variant="page" onLightBackground />
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.85rem' }}>
          <div style={{ flex: '0 1 52px', height: 1, background: `${ORANGE}55` }} />
          <span style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: 500, letterSpacing: '0.28em', color: TEXT_BODY }}>
            Fin
          </span>
          <div style={{ flex: '0 1 52px', height: 1, background: `${ORANGE}55` }} />
        </div>

        <h2
          style={{
            fontWeight: 600,
            fontStyle: 'italic',
            fontSize: 'clamp(1.45rem, 4.2vw, 2.15rem)',
            color: TEXT_TITLE,
            letterSpacing: '0.02em',
            lineHeight: 1.2,
            marginBottom: hasTitleExtras ? '0.55rem' : '1.35rem',
          }}
        >
          {titulo}
        </h2>

        {subtitulo?.trim() ? (
          <p
            style={{
              margin: '0 auto 1rem',
              maxWidth: '36rem',
              fontSize: '1rem',
              lineHeight: 1.55,
              color: TEXT_BODY,
              fontWeight: 500,
            }}
          >
            {subtitulo}
          </p>
        ) : null}

        {fechaStr ? (
          <p
            style={{
              margin: '0 0 1.35rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEXT_BODY,
            }}
          >
            {fechaStr}
          </p>
        ) : null}

        {citaDestacada ? (
          <blockquote
            style={{
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: '1.0625rem',
              lineHeight: 1.7,
              letterSpacing: '0.03em',
              color: neu.textMain,
              borderLeft: `3px solid ${ORANGE}`,
              paddingLeft: '1.2rem',
              margin: '0 0 1.75rem',
              textAlign: 'left',
              backgroundColor: neu.bg,
              borderRadius: '0 12px 12px 0',
              paddingTop: '0.65rem',
              paddingBottom: '0.65rem',
              paddingRight: '0.75rem',
              boxShadow: neu.cardInset.boxShadow as string,
            }}
          >
            &quot;{citaDestacada}&quot;
          </blockquote>
        ) : null}

        <div
          style={{
            ...neu.cardInset,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.15rem',
            padding: '1.15rem 1.35rem',
            marginBottom: tags && tags.length > 0 ? '1.5rem' : '1.95rem',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <img
            src={autor.avatar}
            alt={autor.nombre}
            width={54}
            height={54}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${ORANGE}50`,
              flexShrink: 0,
              boxShadow: '8px 8px 14px rgba(163,177,198,0.42), -4px -4px 10px rgba(255,255,255,0.65)',
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.98rem', color: TEXT_TITLE, marginBottom: autor.ubicacion ? '0.2rem' : 0 }}>
              {autor.nombre}
            </p>
            {autor.ubicacion ? (
              <p style={{ fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_BODY }}>
                {autor.ubicacion}
              </p>
            ) : null}
            {autor.bio ? (
              <p style={{ fontWeight: 400, fontSize: '0.8rem', lineHeight: 1.52, color: TEXT_BODY, marginTop: '0.4rem', opacity: 0.94 }}>
                {autor.bio}
              </p>
            ) : null}
          </div>
        </div>

        {tags && tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'center', marginBottom: '1.95rem' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: ORANGE,
                  border: `1px solid rgba(255,69,0,0.26)`,
                  padding: '0.32rem 0.75rem',
                  borderRadius: 999,
                  backgroundColor: neu.bg,
                  boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.35), inset -2px -2px 4px rgba(255,255,255,0.75)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.95rem', width: '100%', justifyContent: 'stretch' }}>
          <button
            type="button"
            onClick={onReplay}
            style={{
              ...neu.button,
              flex: '1 1 160px',
              padding: '0.92rem 1rem',
              borderRadius: 999,
              fontFamily: SITE_FONT_STACK,
              fontWeight: 600,
              fontSize: '0.74rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: neu.textMain,
              boxShadow: `${String(neu.button.boxShadow)}, inset 0 1px 0 rgba(255,255,255,0.75)`,
            }}
          >
            {replayLabel}
          </button>
          <button
            type="button"
            onClick={onMoreStories}
            style={{
              flex: '1 1 160px',
              padding: '0.92rem 1rem',
              borderRadius: 999,
              border: `1px solid rgba(255,69,0,0.32)`,
              fontFamily: SITE_FONT_STACK,
              fontWeight: 700,
              fontSize: '0.74rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: '#fff',
              background: `linear-gradient(165deg, #ff7138 0%, ${neu.orange} 52%, ${neu.orange} 100%)`,
              boxShadow: SOFT_ORANGE_SHADOW,
            }}
          >
            Más historias
          </button>
        </div>
      </div>

      <style>{`
        @keyframes storyEndReveal {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .story-end-reveal { animation: storyEndReveal 0.78s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </div>
  );
}
