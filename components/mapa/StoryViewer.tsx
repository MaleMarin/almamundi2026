'use client';

import { CintaMini } from '@/components/hilos/CintaMini';
import { useCallback, useEffect, useLayoutEffect, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Heart, Share2 } from 'lucide-react';
import type { StoryPoint } from '@/lib/map-data/stories';
import { duckAmbient } from '@/lib/sound/ambient';
import { getApproxLocation } from '@/lib/userLocation';
import { incrementStoriesRead, shouldShowMomentoJusto, markMomentoJustoShown } from '@/lib/sessionTracker';
import { EcoRecorder } from '@/components/mapa/EcoRecorder';
import { RelatedCarousel } from '@/components/mapa/RelatedCarousel';
import { ReadingChain } from '@/components/mapa/ReadingChain';
import { ShareAfterNotice } from '@/components/stories/ShareAfterNotice';
import { useHomeLocaleOptional } from '@/components/i18n/LocaleProvider';
import { formatPublicName, formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { RespondeALine } from '@/components/historia/RespondeALine';
import { preguntaPorId } from '@/lib/pregunta-semana';
import { SITE_FONT_STACK } from '@/lib/typography';
import { bindGlobePanelScroll, globePanelHasMore, placeGlobeStoryPanel } from '@/components/map/globeStoryPanel';
import { isShortCode } from '@/lib/short-code';

type Props = {
  story: StoryPoint;
  onClose: () => void;
  isClosing: boolean;
  onSelectRelated?: (story: StoryPoint) => void;
  /** Home mapa: un solo panel, máximo media pantalla. */
  variant?: 'full' | 'compact';
  /** Cierra el panel y abre las cuatro tarjetas del hero. */
  onTellStory?: () => void;
  /** Respuesta del mapa: sin ficha de /historias. */
  catalog?: boolean;
  /** Vuelve al listado del mismo panel. */
  onBack?: () => void;
};

function KenBurnsViewer({
  photos }: {
  photos: { url: string; name: string; date: string }[];
}) {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('enter'));
    const t1 = setTimeout(() => setPhase('hold'), 1500);
    const t2 = setTimeout(() => setPhase('exit'), 5500);
    const t3 = setTimeout(() => {
      setCurrent((c) => (c + 1) % photos.length);
    }, 6500);

    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [current, photos.length]);

  const photo = photos[current];
  if (!photo) return null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24 }}
    >
      <div
        style={{
          width: '100%',
          height: 320,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          background: 'var(--home-bg)' }}
      >
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'none',
            opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
            transition:
              phase === 'enter'
                ? 'opacity 1500ms ease, transform 6000ms ease-out'
                : phase === 'exit'
                  ? 'opacity 1000ms ease'
                  : 'transform 6000ms ease-out' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background:
              'linear-gradient(to top, rgba(5,8,20,0.95) 0%, transparent 100%)',
            borderRadius: '0 0 16px 16px' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 18,
            right: 18,
            zIndex: 2,
            opacity: phase === 'hold' ? 1 : 0,
            transition: 'opacity 800ms ease' }}
        >
          <p
            style={{
              fontSize: 'var(--fs-pequeno)',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.92)',
              margin: '0 0 3px',
              fontFamily: SITE_FONT_STACK,
              fontStyle: 'italic' }}
          >
            {photo.name}
          </p>
          <p
            style={{
              fontSize: 'var(--fs-etiqueta)',
              color: 'rgba(255,255,255,0.40)',
              margin: 0,
              fontFamily: SITE_FONT_STACK }}
          >
            {photo.date}
          </p>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            fontSize: 'var(--fs-etiqueta)',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: SITE_FONT_STACK,
            zIndex: 2 }}
        >
          {current + 1} / {photos.length}
        </div>
      </div>
      {photos.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 12 }}
        >
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background:
                  i === current
                    ? 'rgba(255,255,255,0.60)'
                    : 'rgba(255,255,255,0.18)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                transition: 'all 300ms ease' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const BACK_LABEL = { es: 'Volver', pt: 'Voltar', en: 'Back' } as const;

/** El eco sigue en el código. No se muestra en el sitio público por ahora. */
const SHOW_PUBLIC_ECO = false;

/** «Me emocionó» y su contador siguen en el código. No se muestran en el sitio público. */
const SHOW_PUBLIC_RESONANCE = false;

const FORMAT_LABEL = {
  es: { video: 'Video', audio: 'Audio', image: 'Foto', text: 'Texto' },
  pt: { video: 'Vídeo', audio: 'Áudio', image: 'Foto', text: 'Texto' },
  en: { video: 'Video', audio: 'Audio', image: 'Photo', text: 'Text' },
} as const;

const SHARE_LABEL = { es: 'Comparte o regala', pt: 'Compartilhe ou presenteie', en: 'Share or gift' } as const;
const TELL_LABEL = { es: 'Cuenta tu historia', pt: 'Conte sua história', en: 'Tell your story' } as const;
const MOVED_LABEL = { es: 'Me emocionó', pt: 'Me emocionou', en: 'This moved me' } as const;

function isRepeatedFormatLine(line: string): boolean {
  return /^.+·.+·\s*Formato:\s*.+$/i.test(line.trim());
}
const BY_LABEL = { es: 'Por', pt: 'Por', en: 'By' } as const;

type PhotoSlide = {
  url: string;
  name?: string;
  year?: string;
  place?: string;
  description?: string;
};

function photoSlides(story: StoryPoint): PhotoSlide[] {
  const imagenes = story.imagenes as
    | { url: string; titulo?: string; anio?: string; anioAprox?: boolean; lugar?: string; descripcion?: string; caption?: string }[]
    | undefined;
  if (imagenes?.length) {
    return imagenes
      .filter((img) => img.url)
      .map((img) => {
        const anio = img.anio?.trim();
        return {
          url: img.url,
          name: img.titulo?.trim() || undefined,
          year: anio ? (img.anioAprox ? `años ${anio}` : anio) : undefined,
          place: img.lugar?.trim() || undefined,
          description: img.descripcion?.trim() || undefined,
        };
      });
  }
  if (story.photos?.length) {
    return story.photos.map((photo) => ({
      url: photo.url,
      name: photo.name?.trim() || undefined,
      year: photo.date?.trim() || undefined,
    }));
  }
  if (story.imageUrl) return [{ url: story.imageUrl }];
  return [];
}

function PhotoNavigator({ slides }: { slides: PhotoSlide[] }) {
  const [current, setCurrent] = useState(0);
  const slide = slides[Math.min(current, slides.length - 1)];
  if (!slide) return null;
  const lines = [slide.name, slide.year, slide.place, slide.description].filter(Boolean);
  return (
    <div style={{ marginBottom: 24 }}>
      <img
        src={slide.url}
        alt={slide.description || slide.name || ''}
        style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 16, background: 'var(--home-bg)' }}
      />
      {lines.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          {lines.map((line) => (
            <p key={line} style={{ margin: '0 0 4px', fontSize: 'var(--fs-pequeno)', lineHeight: 1.45, color: 'rgba(255,255,255,0.82)', fontFamily: SITE_FONT_STACK }}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {slides.length > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <button
            type="button"
            className="btn-am-neutro"
            onClick={() => setCurrent((i) => (i - 1 + slides.length) % slides.length)}
            style={{ minHeight: 44, padding: '8px 14px', fontFamily: SITE_FONT_STACK }}
          >
            ‹
          </button>
          <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255,255,255,0.55)', fontFamily: SITE_FONT_STACK }}>
            {current + 1} / {slides.length}
          </span>
          <button
            type="button"
            className="btn-am-neutro"
            onClick={() => setCurrent((i) => (i + 1) % slides.length)}
            style={{ minHeight: 44, padding: '8px 14px', fontFamily: SITE_FONT_STACK }}
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StoryViewer({ story, onClose, isClosing, onSelectRelated, variant = 'full', onTellStory, catalog = true, onBack }: Props) {
  const locale = useHomeLocaleOptional()?.locale ?? 'es';
  const compact = variant === 'compact';
  // Tarjeta del mapa (decisión de Ana, 4 nov 2026): fondo hueso como el resto del sitio, texto oscuro.
  const tinta = compact ? '#3c4655' : 'rgba(255,255,255,0.96)';
  const tintaSuave = compact ? '#616c7c' : 'rgba(255,255,255,0.72)';
  const tintaTexto = compact ? '#3c4655' : 'rgba(255,255,255,0.78)';
  const lineaSuave = compact ? 'rgba(60,70,85,0.10)' : 'rgba(255,255,255,0.07)';
  const botonFondo = compact ? 'rgba(60,70,85,0.06)' : 'rgba(255,255,255,0.08)';
  const botonBorde = compact ? 'rgba(60,70,85,0.14)' : 'rgba(255,255,255,0.12)';
  const soloAudio = Boolean(story.audioUrl) && !story.videoUrl;
  // Video y audio: después de quien cuenta y su lugar, solo los dos botones, sin texto (Ana, 4 nov 2026).
  const sinRelato = Boolean(story.videoUrl) || soloAudio;
  const [mounted, setMounted] = useState(false);
  const [ecoPanel, setEcoPanel] = useState<null | 'voice' | 'text'>(null);
  const [listening, setListening] = useState(false);
  const [lastSecondText, setLastSecondText] = useState('');
  const [lastSecondSent, setLastSecondSent] = useState(false);
  const [resonanceSent, setResonanceSent] = useState(false);
  const [resonanceExtra, setResonanceExtra] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [showMomentoJusto, setShowMomentoJusto] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const alreadySentKey = `resonance_${story.id}`;
  const alreadySent =
    typeof window !== 'undefined' && sessionStorage.getItem(alreadySentKey) === '1';

  useEffect(() => {
    if (!story.id || isShortCode(story.shortCode)) return;
    void fetch(`/api/stories/${encodeURIComponent(story.id)}`, { cache: 'no-store' }).catch(() => undefined);
  }, [story.id, story.shortCode]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    duckAmbient(true);
    incrementStoriesRead(story.id);
    setEcoPanel(null);
    setLastSecondText('');
    setLastSecondSent(false);
    setResonanceSent(false);
    setResonanceExtra(0);
    return () => {
      duckAmbient(false);
    };
  }, [story.id]);

  const syncMore = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setMoreBelow(globePanelHasMore(el));
  }, []);

  useLayoutEffect(() => {
    // La tarjeta de historia ya no se ubica junto al globo: va centrada en la pantalla con CSS (Ana, 4 nov 2026).
    if (!compact || compact) return;
    const panel = panelRef.current;
    if (!panel) return;

    const place = () => placeGlobeStoryPanel(panel);
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [compact, story.id]);

  useLayoutEffect(() => {
    if (!compact) return;
    const panel = panelRef.current;
    const el = scrollRef.current;
    if (!panel || !el) return;
    syncMore();
    const unbind = bindGlobePanelScroll(panel, el);
    el.addEventListener('scroll', syncMore, { passive: true });
    const observer = new ResizeObserver(syncMore);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      unbind();
      el.removeEventListener('scroll', syncMore);
      observer.disconnect();
    };
  }, [compact, story.id, syncMore]);

  useEffect(() => {
    if (!endRef.current) return;
    let fired = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fired) {
          fired = true;
          if (!compact && shouldShowMomentoJusto()) {
            markMomentoJustoShown();
            setTimeout(() => setShowMomentoJusto(true), 2000);
          }
        }
      },
      { threshold: 0.9 }
    );
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [story.id, compact]);

  const photos = story.photos ?? [];
  const slides = photoSlides(story);
  const tieneMedio = Boolean(story.videoUrl || story.audioUrl || slides.length > 0);
  const format = story.videoUrl
    ? 'video'
    : story.audioUrl
      ? 'audio'
      : slides.length > 0
        ? 'photos'
        : 'text';
  const formatKey = format === 'photos' ? 'image' : format;
  const place = formatPublicPlace(story.city, story.country, locale);
  const formatWord = FORMAT_LABEL[locale][formatKey];
  const kicker = formatWord;
  const temaPregunta = catalog ? null : preguntaPorId(story.questionId)?.tema[locale];
  const alias = formatPublicName(story.authorName || story.author?.name);

  const startListening = () => {
    if (!story.body || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(story.body);
    utter.lang = 'es-ES';
    utter.rate = 0.82;
    utter.pitch = 0.95;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const esVoice =
      voices.find((v) =>
        v.lang.startsWith('es') &&
        (v.name.includes('Female') || v.name.includes('Lucía') || v.name.includes('Monica'))
      ) ?? voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) utter.voice = esVoice;
    utter.onend = () => setListening(false);
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
    setListening(true);
  };

  const stopListening = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setListening(false);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);


  useEffect(() => {
    if (catalog) return;
    const root = panelRef.current;
    if (!root) return;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.hasAttribute('disabled')
      );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = focusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    root.addEventListener('keydown', onTab);
    focusable()[0]?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('keydown', onTab);
    };
  }, [catalog, story.id]);

  return (
    <>
      <style>{`
        @keyframes storySlideUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes storySlideDown {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(60px); }
        }
        @keyframes ecoFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rainAtm {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
      `}</style>

      <GlobePanelFrame active={compact}>
      <div
        ref={panelRef}
        role={catalog ? undefined : 'dialog'}
        aria-modal={catalog ? undefined : true}
        aria-label={catalog ? undefined : story.title ?? story.label}
        className={compact ? 'story-map-panel story-map-panel--historia' : undefined}
        style={compact ? undefined : {
          position: 'fixed',
          left: 'clamp(0px, 30vw, 420px)',
          right: 0,
          bottom: 0,
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pointerEvents: 'none' }}
      >
        <div
          className={compact ? 'story-map-panel__card' : undefined}
          style={{
            width: '100%',
            maxWidth: compact ? '100%' : 720,
            maxHeight: compact ? '100%' : '85vh',
            height: compact ? 'auto' : undefined,
            margin: compact ? 0 : '0 auto',
            padding: compact ? 0 : '0 24px 24px',
            pointerEvents: 'auto',
            animation: isClosing
              ? 'storySlideDown 400ms ease forwards'
              : mounted
                ? 'storySlideUp 500ms cubic-bezier(0.22,1,0.36,1) forwards'
                : 'none',
            opacity: mounted ? 1 : 0 }}
        >
          <div
            className={compact ? `story-map-panel__sheet story-map-panel__sheet--historia${tieneMedio ? '' : ' story-map-panel__sheet--sin-medio'}` : undefined}
            style={{
              background:     compact ? 'rgba(251, 250, 248, 0.93)' : 'rgba(6, 10, 22, 0.82)',
              backdropFilter: 'blur(48px) saturate(180%)',
              WebkitBackdropFilter: 'blur(48px) saturate(180%)',
              border:         compact ? '1px solid rgba(255, 255, 255, 0.7)' : '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius:   28,
              boxShadow: `
                inset 0 1.5px 0 rgba(255, 255, 255, 0.14),
                inset 0 -1px 0 rgba(255, 255, 255, 0.04),
                0 40px 80px rgba(0, 0, 0, 0.70),
                0 8px 32px rgba(0, 0, 0, 0.40)
              `,
              overflow:       'hidden',
              maxHeight:      compact ? '100%' : '85vh',
              height:         compact ? 'auto' : undefined,
              minHeight:      compact ? 0 : undefined,
              display:        'flex',
              flexDirection:  'column',
              position:       'relative' }}
          >
            {compact && tieneMedio ? (
              <div className={`story-map-panel__medio${soloAudio ? ' story-map-panel__medio--audio' : ''}`}>
                {story.videoUrl ? (
                  <video controls src={story.videoUrl} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain', background: '#000' }} />
                ) : soloAudio ? (
                  <>
                    <CintaMini
                      storyId={story.id ?? ''}
                      units={story.huellaUnits ?? null}
                      text={story.body ?? story.title ?? ''}
                      locale={locale}
                      className="story-map-panel__cinta"
                      width={800}
                      height={800}
                    />
                    <div className="story-map-panel__reproductor">
                      <audio controls src={story.audioUrl} style={{ width: '100%' }} />
                    </div>
                  </>
                ) : (
                  <PhotoNavigator slides={slides} />
                )}
              </div>
            ) : null}
            {/* Reflejo de luz en el borde superior */}
            <div aria-hidden style={{
              position:      'absolute',
              top:           0,
              left:          '10%',
              right:         '10%',
              height:       1,
              background:    'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              pointerEvents: 'none',
              zIndex:        1 }} />
            <div
              className={compact ? 'story-map-panel__cabecera' : undefined}
              style={{
                position: 'relative',
                zIndex: 2,
                padding: compact ? '30px 32px 16px' : '22px 24px 16px',
                borderBottom: `1px solid ${lineaSuave}`,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 'var(--fs-etiqueta)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: compact ? '#b8340f' : 'rgba(var(--almamundi-orange-rgb), 0.70)',
                    margin: '0 0 6px',
                    fontFamily: SITE_FONT_STACK }}
                >
                  {kicker}
                </p>
                <h2
                  style={{
                    fontSize: 'var(--fs-titular)',
                    fontWeight: 400,
                    color: tinta,
                    margin: '0 0 4px',
                    lineHeight: 1.2,
                    fontFamily: SITE_FONT_STACK }}
                >
                  {story.title ?? story.label}
                </h2>
                {temaPregunta ? (
                  <p
                    style={{
                      fontSize: 'var(--fs-etiqueta)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: tintaSuave,
                      margin: '0 0 4px',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    {temaPregunta}
                  </p>
                ) : null}
                <RespondeALine
                  questionId={story.questionId}
                  questionMode={story.questionMode}
                  color={compact ? '#3c4655' : 'rgba(255,255,255,0.92)'}
                />
                {alias ? (
                <p
                  style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: compact ? tinta : 'rgba(255,255,255,0.72)',
                    fontWeight: compact ? 600 : undefined,
                    margin: 0,
                    fontFamily: SITE_FONT_STACK }}
                >
                  {BY_LABEL[locale]} {alias}
                </p>
                ) : null}
                {place ? (
                <p
                  style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: tintaSuave,
                    margin: '2px 0 0',
                    fontFamily: SITE_FONT_STACK }}
                >
                  {place}
                </p>
                ) : null}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0, marginLeft: 16 }}>
              {onBack ? (
              <button
                type="button"
                onClick={onBack}
                style={{
                  minHeight: 36,
                  padding: '0 12px',
                  borderRadius: 999,
                  background: botonFondo,
                  border: `1px solid ${botonBorde}`,
                  color: compact ? tinta : 'rgba(255,255,255,0.82)',
                  cursor: 'pointer',
                  fontSize: 'var(--fs-etiqueta)',
                  fontFamily: SITE_FONT_STACK,
                  flexShrink: 0 }}
              >
                {BACK_LABEL[locale]}
              </button>
              ) : null}
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: botonFondo,
                  border: `1px solid ${botonBorde}`,
                  color: compact ? tinta : 'rgba(255,255,255,0.60)',
                  cursor: 'pointer',
                  fontSize: 'var(--fs-texto)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  outline: 'none',
                  transition: 'all 150ms ease' }}
              >
                ×
              </button>
              </div>
            </div>

            <div
              ref={compact ? scrollRef : undefined}
              className={compact ? 'story-map-panel__scroll' : undefined}
              style={{
                position: 'relative',
                zIndex: 2,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                padding: compact ? '20px 32px 26px' : '24px 24px 28px',
                flex: compact ? '1 1 auto' : 1,
                minHeight: compact ? 0 : undefined,
                overscrollBehavior: compact ? 'contain' : undefined,
                touchAction: compact ? 'pan-y' : undefined }}
            >
              {!compact && story.videoUrl ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                  <video
                    controls
                    src={story.videoUrl}
                    style={{ width: '100%', display: 'block', maxHeight: 280, background: '#000' }}
                  />
                </div>
              ) : null}

              {!compact && story.audioUrl ? (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '20px',
                    marginBottom: 24 }}
                >
                  <audio
                    controls
                    src={story.audioUrl}
                    style={{ width: '100%' }}
                  />
                </div>
              ) : null}

              {!compact && slides.length > 0 ? <PhotoNavigator slides={slides} /> : null}

              {/* Audio: solo nombre de la historia, quien la cuenta, ciudad y país, sin texto (Ana, 4 nov 2026). */}
              {story.body && !sinRelato ? (
                <div
                  className={compact ? 'story-map-panel__relato' : undefined}
                  style={{
                    fontSize: 'var(--fs-texto)',
                    lineHeight: compact ? 1.7 : 1.85,
                    color: tintaTexto,
                    fontFamily: SITE_FONT_STACK }}
                >
                  {story.body
                    .split('\n')
                    .filter((p) => p.trim() && !isRepeatedFormatLine(p))
                    .map((p, i, all) => (
                      <p key={i} style={{ marginBottom: compact && i === all.length - 1 ? 0 : '1.4em' }}>
                        {p}
                      </p>
                    ))}
                </div>
              ) : null}

              <div ref={endRef} style={{ height: 1 }} />

              {SHOW_PUBLIC_ECO && ecoPanel === 'voice' ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    background: 'rgba(8,12,25,0.55)',
                    border: '1px solid rgba(var(--almamundi-orange-rgb), 0.18)',
                    borderRadius: 16 }}
                >
                  <p
                    style={{
                      fontSize: 'var(--fs-etiqueta)',
                      color: 'rgba(255,255,255,0.70)',
                      margin: '0 0 10px',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    ¿Quieres dejar tu reacción?
                    <span style={{ display: 'block', fontSize: 'var(--fs-etiqueta)', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                      10 segundos. Sin edición. Solo tu voz.
                    </span>
                  </p>
                  <EcoRecorder storyId={story.id ?? ''} onDone={() => setEcoPanel(null)} />
                  <button
                    type="button"
                    onClick={() => setEcoPanel('text')}
                    style={{
                      marginTop: 10,
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,180,80,0.9)',
                      cursor: 'pointer',
                      fontSize: 'var(--fs-etiqueta)',
                      fontFamily: SITE_FONT_STACK,
                      padding: 0 }}
                  >
                    Prefiero escribir
                  </button>
                </div>
              ) : null}

              {SHOW_PUBLIC_ECO && ecoPanel === 'text' && !lastSecondSent ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    background: 'rgba(8,12,25,0.55)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16 }}
                >
                  <p
                    style={{
                      fontSize: 'var(--fs-etiqueta)',
                      color: 'rgba(255,255,255,0.70)',
                      margin: '0 0 4px',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    ¿Hay algo que no dijiste en esta historia?
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--fs-etiqueta)',
                      color: 'rgba(255,255,255,0.28)',
                      margin: '0 0 10px',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    El autor lo recibirá. Máximo dos líneas.
                  </p>
                  <textarea
                    value={lastSecondText}
                    onChange={(e) => {
                      if (e.target.value.length <= 180) setLastSecondText(e.target.value);
                    }}
                    placeholder="Lo que quedó sin decir..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.82)',
                      fontSize: 'var(--fs-etiqueta)',
                      fontFamily: SITE_FONT_STACK,
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setEcoPanel('voice')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,180,80,0.9)',
                        cursor: 'pointer',
                        fontSize: 'var(--fs-etiqueta)',
                        fontFamily: SITE_FONT_STACK,
                        padding: 0 }}
                    >
                      Prefiero grabar voz
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEcoPanel(null)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 999,
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.55)',
                          cursor: 'pointer',
                          fontSize: 'var(--fs-etiqueta)',
                          fontFamily: SITE_FONT_STACK }}
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        className="btn-am-principal"
                        disabled={!lastSecondText.trim()}
                        onClick={async () => {
                          try {
                            await fetch(`/api/stories/${story.id}/addendum`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: lastSecondText }) });
                          } catch {}
                          setLastSecondSent(true);
                          setEcoPanel(null);
                        }}
                        style={{
                          padding: '7px 16px',
                          fontSize: 'var(--fs-etiqueta)',
                          fontFamily: SITE_FONT_STACK }}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {!compact ? <ReadingChain storyId={story.id ?? ''} /> : null}

              {!compact && onSelectRelated ? (
                <RelatedCarousel
                  currentStoryId={story.id ?? ''}
                  onSelect={onSelectRelated}
                />
              ) : null}

              {!compact && showMomentoJusto ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: '16px 18px',
                    background: 'rgba(8,12,25,0.55)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    textAlign: 'center' }}
                >
                  <p style={{ fontSize: 'var(--fs-pequeno)', color: 'rgba(255,255,255,0.82)', margin: '0 0 6px', fontFamily: SITE_FONT_STACK }}>
                    Llevas un rato aquí.
                  </p>
                  <p style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255,255,255,0.40)', margin: '0 0 14px', fontFamily: SITE_FONT_STACK }}>
                    ¿Hay algo tuyo que podría vivir en este mapa?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMomentoJusto(false);
                      onClose();
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('almamundi:openModal'));
                      }, 600);
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 999,
                      background: 'rgba(var(--almamundi-orange-rgb), 0.18)',
                      border: '1px solid rgba(var(--almamundi-orange-rgb), 0.35)',
                      color: '#fdba74',
                      cursor: 'pointer',
                      fontSize: 'var(--fs-etiqueta)',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    Sí, quiero contarlo
                  </button>
                </div>
              ) : null}

              {compact ? <div aria-hidden style={{ height: sinRelato ? 8 : 24, flexShrink: 0 }} /> : null}
              {compact ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 0 }}
              >
              {catalog ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 8 }}
              >
                <button
                  type="button"
                  className="btn-am-principal"
                  onClick={() => setShareOpen(true)}
                  style={{
                    flex: '1 1 0',
                    minHeight: 44,
                    padding: '8px 12px',
                    fontFamily: SITE_FONT_STACK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center' }}
                >
                  {SHARE_LABEL[locale]}
                </button>
                <button
                  type="button"
                  className="btn-am-secundario"
                  onClick={() => onTellStory?.()}
                  style={{
                    flex: '1 1 0',
                    minHeight: 44,
                    padding: '8px 12px',
                    fontFamily: SITE_FONT_STACK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center' }}
                >
                  {TELL_LABEL[locale]}
                </button>
              </div>
              ) : null}
              </div>
              ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginTop: 8 }}
              >
                {SHOW_PUBLIC_RESONANCE ? (
                <button
                  type="button"
                  className="btn-am-secundario"
                  disabled={alreadySent || resonanceSent}
                  onClick={async () => {
                    if (alreadySent || resonanceSent) return;
                    try {
                      const loc = await getApproxLocation();
                      await fetch(`/api/stories/${story.id}/resonance`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lat: loc?.lat, lng: loc?.lng }) });
                    } catch {}
                    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(alreadySentKey, '1');
                    setResonanceExtra(1);
                    setResonanceSent(true);
                  }}
                  style={{
                    minHeight: 44,
                    padding: '8px 16px',
                    fontFamily: SITE_FONT_STACK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8 }}
                >
                  {MOVED_LABEL[locale]}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Heart size={16} fill="currentColor" aria-hidden />
                    {(story.resonancesCount ?? 0) + resonanceExtra}
                  </span>
                </button>
                ) : null}
                <button
                  type="button"
                  className="btn-am-principal"
                  onClick={() => setShareOpen(true)}
                  style={{
                    minHeight: 44,
                    padding: '8px 16px',
                    fontFamily: SITE_FONT_STACK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8 }}
                >
                  <Share2 size={16} aria-hidden />
                  {SHARE_LABEL[locale]}
                </button>
                {SHOW_PUBLIC_ECO ? (
                  <ActionButton
                    label="¿Dejar un eco?"
                    onClick={() => setEcoPanel((p) => (p ? null : 'voice'))}
                    accent
                  />
                ) : null}
              </div>
              )}
            </div>
            {compact && moreBelow ? <div className="story-map-panel__more" aria-hidden /> : null}
          </div>

          <ShareAfterNotice
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            kind="story"
            storyId={story.id ?? ''}
            title={story.title ?? story.label}
            city={story.city ?? ''}
            format={format === 'photos' ? 'photo' : format}
          />
        </div>
      </div>
      </GlobePanelFrame>
    </>
  );
}

function GlobePanelFrame({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active || typeof document === 'undefined') return children;
  // La historia se abre al centro de la pantalla (Ana, 4 nov 2026): va directo al body,
  // para que ningún contenedor del mapa la corra ni la recorte.
  return createPortal(children, document.body);
}

function ActionButton({
  label,
  onClick,
  accent = false,
  className }: {
  label: string;
  onClick: () => void;
  accent?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      style={{
        padding: '9px 18px',
        borderRadius: 999,
        background: accent ? 'rgba(var(--almamundi-orange-rgb), 0.14)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${accent ? 'rgba(var(--almamundi-orange-rgb), 0.30)' : 'rgba(255,255,255,0.10)'}`,
        color: accent ? '#fdba74' : 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        fontSize: 'var(--fs-etiqueta)',
        fontFamily: SITE_FONT_STACK,
        outline: 'none',
        transition: 'all 180ms ease' }}
    >
      {label}
    </button>
  );
}
