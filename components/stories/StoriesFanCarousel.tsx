'use client';

/**
 * StoriesFanCarousel — AlmaMundi
 * Carrusel en abanico con perspectiva 3D para explorar historias.
 * Reemplaza CinemaGallery en app/historias/videos/page.tsx
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import VideoPlayer from '@/components/historia/VideoPlayer'
import type { StoryPoint } from '@/lib/map-data/stories'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(' · ') || s.label || ''
}
function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#8b6914" opacity="0.3"/><text x="50" y="64" font-family="serif" font-size="46" font-weight="300" fill="#c9a96e" text-anchor="middle">${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const PLACEHOLDER_THUMB =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#e8e4dc" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8b7a6a">Sin imagen</text></svg>'
  )
function formatLabel(fmt: string): string {
  return { video: 'Video', audio: 'Audio', texto: 'Escritura', foto: 'Fotografía' }[fmt] ?? fmt
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type StoriesFanCarouselProps = {
  stories: StoryPoint[]
  /** Si es 'audio', al hacer clic se llama onSelectStory y no se abre VideoPlayer. */
  mode?: 'video' | 'audio'
  onSelectStory?: (story: StoryPoint) => void
  /** Para "Mi colección": guardar la historia actual. */
  onSaveToCollection?: (story: StoryPoint) => void
  /** Indica si la historia ya está guardada (muestra "En tu colección"). */
  isSavedInCollection?: (id: string) => boolean
}

type ActiveVideo = {
  id: string; titulo: string; subtitulo?: string
  videoUrl: string; thumbnailUrl: string; duracion: number; fecha: string
  autor: { nombre: string; avatar: string; ubicacion?: string; bio?: string }
  tags?: string[]; citaDestacada?: string
}

// ─── Card position calculator ─────────────────────────────────────────────────
function getPos(index: number, active: number) {
  const off = index - active
  const abs = Math.abs(off)
  const sgn = off < 0 ? -1 : off > 0 ? 1 : 0
  return {
    x:      sgn * (abs === 0 ? 0 : 115 + (abs - 1) * 85),
    z:      abs === 0 ? 0 : -70 - (abs - 1) * 35,
    rotY:   sgn * (abs === 0 ? 0 : 26 + (abs - 1) * 7),
    scale:  abs === 0 ? 1 : abs === 1 ? 0.84 : 0.70,
    opacity: abs === 0 ? 1 : abs === 1 ? 0.72 : 0.42,
    zIndex: 10 - abs,
    isCenter: abs === 0,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export function StoriesFanCarousel({ stories, mode = 'video', onSelectStory, onSaveToCollection, isSavedInCollection }: StoriesFanCarouselProps) {
  const [active, setActive] = useState(Math.floor(stories.length / 2))
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const goTo = useCallback((i: number) => {
    setActive(Math.max(0, Math.min(stories.length - 1, i)))
  }, [stories.length])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (activeVideo) return
      if (e.key === 'ArrowLeft')  goTo(active - 1)
      if (e.key === 'ArrowRight') goTo(active + 1)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [active, goTo, activeVideo])

  const openCinema = (s: StoryPoint) => {
    onSelectStory?.(s)
    const raw = s.imageUrl ?? s.thumbnailUrl ?? (s as Record<string, unknown>).image ?? (s as Record<string, unknown>).thumbnail ?? (s as Record<string, unknown>).coverImage ?? (s as Record<string, unknown>).videoThumbnail ?? ''
    const thumb = (String(raw).trim() || PLACEHOLDER_THUMB) as string
    setActiveVideo({
      id: s.id,
      titulo: s.title ?? s.label ?? 'Historia',
      subtitulo: s.subtitle,
      videoUrl: (s.videoUrl ?? '').trim() || '#',
      thumbnailUrl: thumb,
      duracion: 0,
      fecha: s.publishedAt ?? '',
      autor: {
        nombre: s.authorName ?? s.author?.name ?? '',
        avatar: s.author?.avatar ?? s.authorAvatar ?? defaultAvatar(s.authorName ?? ''),
        ubicacion: formatPlace(s) || undefined,
        bio: s.author?.bio,
      },
      tags: s.tags,
      citaDestacada: s.quote,
    })
  }

  if (!stories.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b6914', fontFamily: "'Jost', sans-serif", fontSize: '1rem' }}>
      No hay historias por ahora.
    </div>
  )

  const current = stories[active]
  const authorName = current?.authorName ?? current?.author?.name ?? ''
  const authorAvatar = current?.author?.avatar ?? current?.authorAvatar ?? defaultAvatar(authorName)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

        .sfc-root * { box-sizing: border-box; }

        .sfc-card {
          position: absolute;
          width: 190px; height: 290px;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, filter 0.4s ease;
          transform-style: preserve-3d;
        }
        .sfc-card img.sfc-bg { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.6s ease; }
        .sfc-card:hover img.sfc-bg { transform:scale(1.04); }

        .sfc-vignette { position:absolute; inset:0; background:linear-gradient(to top,rgba(15,10,5,0.9) 0%,rgba(15,10,5,0.3) 55%,rgba(15,10,5,0.1) 100%); }

        .sfc-format {
          position:absolute; top:12px; left:12px;
          background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3);
          border-radius:20px; padding:3px 10px;
          font-family:'Jost',sans-serif; font-weight:300; font-size:9px;
          letter-spacing:0.22em; text-transform:uppercase; color:#fff;
        }

        .sfc-bottom { position:absolute; bottom:0; left:0; right:0; padding:14px 13px; }
        .sfc-title { font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:400; font-size:14px; color:#f5f0e8; line-height:1.3; margin-bottom:8px; }
        .sfc-divider { width:24px; height:1px; background:rgba(201,169,110,0.6); margin-bottom:7px; }
        .sfc-author { display:flex; align-items:center; gap:6px; }
        .sfc-avatar { width:20px; height:20px; border-radius:50%; border:1px solid rgba(201,169,110,0.5); object-fit:cover; flex-shrink:0; }
        .sfc-meta { font-family:'Jost',sans-serif; font-weight:300; font-size:10px; color:rgba(245,240,232,0.7); line-height:1.4; }
        .sfc-meta strong { display:block; font-weight:400; color:#f5f0e8; font-size:11px; }

        .sfc-play {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-60%);
          width:48px; height:48px; border-radius:50%;
          background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.5);
          display:flex; align-items:center; justify-content:center;
          opacity:0; transition:opacity 0.3s; pointer-events:none;
        }
        .sfc-card.sfc-center .sfc-play { opacity:1; }

        .sfc-wave { position:absolute; top:50%; left:50%; transform:translate(-50%,-60%); display:flex; align-items:center; gap:2px; opacity:0; transition:opacity 0.3s; }
        .sfc-card.sfc-center.sfc-audio .sfc-wave { opacity:1; }
        .sfc-card.sfc-center.sfc-audio .sfc-play { opacity:0; }
        .sfc-bar { width:3px; border-radius:2px; background:rgba(255,255,255,0.7); animation:sfcWave 0.8s ease-in-out infinite alternate; }
        @keyframes sfcWave { from{transform:scaleY(0.25)} to{transform:scaleY(1)} }

        .sfc-text-inner { position:absolute; inset:0; background:#faf7f2; padding:18px 14px 0; overflow:hidden; }
        .sfc-text-drop { font-family:'Cormorant Garamond',serif; font-size:56px; font-weight:300; font-style:italic; color:#c9a96e; line-height:1; float:left; margin-right:3px; margin-top:2px; }
        .sfc-text-body { font-family:'Cormorant Garamond',serif; font-size:11.5px; line-height:1.75; color:#3a3028; }
        .sfc-text-fade { position:absolute; bottom:0; left:0; right:0; height:120px; background:linear-gradient(to top,#faf7f2 30%,transparent 100%); }

        .sfc-photo-inner { position:absolute; inset:0; background:#ede8e0; display:flex; align-items:center; justify-content:center; }
        .sfc-polaroid { background:#fff; padding:8px 8px 26px; box-shadow:0 3px 16px rgba(0,0,0,0.18); transform:rotate(-1.8deg); width:156px; height:196px; overflow:hidden; }
        .sfc-polaroid img { width:100%; height:100%; object-fit:cover; display:block; }

        .sfc-nav { transition:background 0.2s; }
        .sfc-nav:hover { background:rgba(26,20,14,0.12) !important; }

        .sfc-info { text-align:center; animation:sfcIn 0.4s ease both; }
        @keyframes sfcIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .sfc-dot { transition:all 0.2s; cursor:pointer; }

        .sfc-cta { transition:background 0.2s, color 0.2s; }
        .sfc-cta:hover { background:rgba(139,105,20,0.08) !important; color:#4a3508 !important; }
      `}</style>

      <div
        className="sfc-root"
        style={{
          background: 'transparent',
          padding: '2.5rem 1rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '580px',
          width: '100%',
        }}
      >
        {/* ── Stage ── */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Prev */}
          <button
            className="sfc-nav"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(26,20,14,0.06)', border: '1px solid rgba(26,20,14,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active === 0 ? 'default' : 'pointer', opacity: active === 0 ? 0.3 : 1, color: '#5a4a3a', zIndex: 20 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="15,18 9,12 15,6" /></svg>
          </button>

          {/* Cards */}
          <div style={{ position: 'relative', width: '100%', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px', marginBottom: '1.8rem' }}>
            {stories.map((s, i) => {
              const p = getPos(i, active)
              const fmt = s.format ?? (s.videoUrl ? 'video' : s.audioUrl ? 'audio' : s.imageUrl ? 'foto' : 'texto')
              const rawThumb = s.imageUrl ?? s.thumbnailUrl ?? (s as Record<string, unknown>).image ?? (s as Record<string, unknown>).thumbnail ?? (s as Record<string, unknown>).coverImage ?? (s as Record<string, unknown>).videoThumbnail ?? ''
              const thumb: string = typeof rawThumb === 'string' && rawThumb.trim() ? rawThumb : PLACEHOLDER_THUMB
              const name = s.authorName ?? s.author?.name ?? ''
              const rawAvatar = s.author?.avatar ?? s.authorAvatar ?? ''
              const avatar = rawAvatar && String(rawAvatar).trim() ? rawAvatar : defaultAvatar(name)
              const place = formatPlace(s)
              const excerpt = s.excerpt ?? s.description ?? ''

              return (
                <div
                  key={s.id}
                  className={`sfc-card ${p.isCenter ? 'sfc-center' : ''} ${fmt === 'audio' ? 'sfc-audio' : ''}`}
                  onClick={() => {
                    if (!p.isCenter) { goTo(i); return }
                    if (mode === 'audio') {
                      onSelectStory?.(s)
                      return
                    }
                    if (s.videoUrl) openCinema(s)
                  }}
                  style={{
                    transform: `translateX(${p.x}px) translateZ(${p.z}px) rotateY(${p.rotY}deg) scale(${p.scale})`,
                    opacity: p.opacity,
                    zIndex: p.zIndex,
                    filter: !p.isCenter ? 'brightness(0.75) saturate(0.5)' : undefined,
                  }}
                >
                  {/* Card inner by format */}
                  {fmt === 'texto' ? (
                    <>
                      <div className="sfc-text-inner">
                        <div className="sfc-text-body">
                          <span className="sfc-text-drop">{(excerpt || 'H')[0]}</span>
                          {excerpt}
                        </div>
                        <div className="sfc-text-fade" />
                      </div>
                      <div className="sfc-vignette" style={{ background: 'linear-gradient(to top,rgba(15,10,5,0.85) 0%,rgba(250,247,242,0) 45%)' }} />
                    </>
                  ) : fmt === 'foto' ? (
                    <>
                      <div className="sfc-photo-inner">
                        <div className="sfc-polaroid"><img src={thumb} alt="" /></div>
                      </div>
                      <div className="sfc-vignette" style={{ background: 'linear-gradient(to top,rgba(15,10,5,0.85) 0%,rgba(237,232,224,0) 45%)' }} />
                    </>
                  ) : (
                    <>
                      <img className="sfc-bg" src={thumb} alt="" />
                      <div className="sfc-vignette" />
                    </>
                  )}

                  <div className="sfc-format">{formatLabel(fmt)}</div>

                  {/* Waveform for audio */}
                  {fmt === 'audio' && (
                    <div className="sfc-wave">
                      {Array.from({ length: 12 }, (_, k) => (
                        <div key={k} className="sfc-bar" style={{ height: `${8 + Math.floor(Math.random() * 28)}px`, animationDelay: `${k * 0.08}s`, animationDuration: `${0.65 + Math.random() * 0.4}s` }} />
                      ))}
                    </div>
                  )}

                  {/* Play */}
                  {fmt !== 'audio' && (
                    <div className="sfc-play">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="6,3 20,12 6,21" /></svg>
                    </div>
                  )}

                  <div className="sfc-bottom">
                    <div className="sfc-title">{s.title ?? s.label}</div>
                    <div className="sfc-divider" />
                    <div className="sfc-author">
                      <img className="sfc-avatar" src={avatar} alt="" />
                      <div className="sfc-meta">
                        <strong>{name}</strong>
                        {place}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Next */}
          <button
            className="sfc-nav"
            onClick={() => goTo(active + 1)}
            disabled={active === stories.length - 1}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(26,20,14,0.06)', border: '1px solid rgba(26,20,14,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active === stories.length - 1 ? 'default' : 'pointer', opacity: active === stories.length - 1 ? 0.3 : 1, color: '#5a4a3a', zIndex: 20 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9,18 15,12 9,6" /></svg>
          </button>
        </div>

        {/* ── Info ── */}
        {current && (
          <div className="sfc-info" key={active}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 300, fontSize: '1.45rem', color: '#1a140e', marginBottom: '5px', lineHeight: 1.2 }}>
              {current.title ?? current.label}
            </p>
            <p style={{ fontFamily: "'Jost',sans-serif", fontWeight: 300, fontSize: '11px', color: '#8b7a6a', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {authorName}
              <span style={{ display: 'inline-block', width: '1px', height: '10px', background: '#c9a96e', margin: '0 8px', verticalAlign: 'middle', opacity: 0.5 }} />
              {formatPlace(current)}
            </p>
          </div>
        )}

        {/* ── Dots ── */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '1.2rem' }}>
          {stories.map((_, i) => (
            <div
              key={i}
              className="sfc-dot"
              onClick={() => goTo(i)}
              style={{ width: i === active ? '18px' : '5px', height: '5px', borderRadius: i === active ? '3px' : '50%', background: i === active ? '#8b6914' : 'rgba(26,20,14,0.15)', border: '1px solid rgba(26,20,14,0.2)' }}
            />
          ))}
        </div>

        {/* ── CTA ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginTop: '1.5rem' }}>
          <button
            className="sfc-cta"
            onClick={() => {
              if (!current) return
              if (mode === 'audio') {
                onSelectStory?.(current)
                return
              }
              openCinema(current)
            }}
            style={{ padding: '0.6rem 2.2rem', borderRadius: '3px', border: '1px solid rgba(139,105,20,0.4)', background: 'transparent', color: '#6b4f10', fontFamily: "'Jost',sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {mode === 'audio' ? 'Escuchar →' : 'Ver esta historia →'}
          </button>
          {current && onSaveToCollection && (
            <button
              type="button"
              onClick={() => onSaveToCollection(current)}
              disabled={isSavedInCollection?.(current.id)}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '3px',
                border: '1px solid rgba(26,20,14,0.2)',
                background: isSavedInCollection?.(current.id) ? 'rgba(139,105,20,0.15)' : 'transparent',
                color: isSavedInCollection?.(current.id) ? '#6b4f10' : '#5a4a3a',
                fontFamily: "'Jost',sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: isSavedInCollection?.(current.id) ? 'default' : 'pointer',
                opacity: isSavedInCollection?.(current.id) ? 0.9 : 1,
              }}
            >
              {isSavedInCollection?.(current.id) ? 'En tu colección' : 'Guardar en mi colección'}
            </button>
          )}
        </div>
      </div>

      {/* ── Cinema overlay ── */}
      {mounted && activeVideo && ReactDOM.createPortal(
        <VideoPlayer historia={activeVideo} onClose={() => setActiveVideo(null)} />,
        document.body
      )}
    </>
  )
}
