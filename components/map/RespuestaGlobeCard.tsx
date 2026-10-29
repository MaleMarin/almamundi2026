'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { EthicalShareFlow } from '@/components/stories/EthicalShareFlow';
import { preguntaAlias } from '@/lib/i18n/pregunta-messages';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { PREGUNTA_UI, preguntaPageHref, preguntaPorId, preguntaTexto } from '@/lib/pregunta-semana';
import type { RespuestaPublica } from '@/lib/respuestas/public';
import { SITE_FONT_STACK } from '@/lib/typography';

const KIND_LABEL = { es: 'Respuesta', pt: 'Resposta', en: 'Answer' } as const;
const SHARE_LABEL = { es: 'Compartir', pt: 'Partilhar', en: 'Share' } as const;
const BY_LABEL = { es: 'Por', pt: 'Por', en: 'By' } as const;

export function RespuestaGlobeCard({
  item,
  onClose }: {
  item: RespuestaPublica;
  onClose: () => void;
}) {
  const { locale, t } = useHomeLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const pregunta = preguntaPorId(item.questionId);
  const question = preguntaTexto(item.questionId, 'tu', locale);
  const place = formatPublicPlace(item.city, item.country);
  const kicker = [KIND_LABEL[locale], pregunta?.tema[locale], place].filter(Boolean).join(' · ');
  const alias = preguntaAlias(item.alias);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/pregunta/${item.questionId}` : '';

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const placePanel = () => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        panel.style.top = '';
        panel.style.height = '';
        panel.style.maxHeight = '';
        return;
      }
      const host = panel.offsetParent as HTMLElement | null;
      if (!host) return;
      const hostRect = host.getBoundingClientRect();
      const siteHeader = [...document.querySelectorAll('header')].find((node) => {
        const box = node.getBoundingClientRect();
        return getComputedStyle(node).position === 'fixed' && box.top <= 1 && box.height > 40;
      });
      const headerBottom = siteHeader ? siteHeader.getBoundingClientRect().bottom : 0;
      const visibleTop = Math.max(hostRect.top, headerBottom);
      const visibleBottom = Math.min(hostRect.bottom, window.innerHeight);
      const top = Math.max(24, visibleTop - hostRect.top + 24);
      const height = Math.max(160, visibleBottom - hostRect.top - top - 24);
      panel.style.top = `${top}px`;
      panel.style.height = `${height}px`;
      panel.style.maxHeight = `${height}px`;
    };

    placePanel();
    window.addEventListener('scroll', placePanel, true);
    window.addEventListener('resize', placePanel);
    return () => {
      window.removeEventListener('scroll', placePanel, true);
      window.removeEventListener('resize', placePanel);
    };
  }, [item.id]);

  return (
    <>
      <style>{`
        .story-map-panel {
          position: absolute;
          z-index: 40;
          top: 24px;
          right: 24px;
          width: 420px;
          max-height: calc(100% - 48px);
          height: auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          pointer-events: none;
        }
        .story-map-panel__card {
          width: 100%;
          height: auto;
          max-height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 767px) {
          .story-map-panel {
            position: fixed;
            top: auto;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: auto;
            max-height: calc(100svh - 9.75rem - 24px);
          }
          .story-map-panel__card {
            max-height: calc(100svh - 9.75rem - 24px);
          }
        }
      `}</style>
      <div ref={panelRef} className="story-map-panel">
        <div className="story-map-panel__card">
          <div
            style={{
              background: 'rgba(6, 10, 22, 0.82)',
              backdropFilter: 'blur(48px) saturate(180%)',
              WebkitBackdropFilter: 'blur(48px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: 28,
              boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(255, 255, 255, 0.04), 0 40px 80px rgba(0, 0, 0, 0.70), 0 8px 32px rgba(0, 0, 0, 0.40)',
              overflow: 'hidden',
              maxHeight: '100%',
              height: 'auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              pointerEvents: 'auto',
              fontFamily: SITE_FONT_STACK }}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '22px 24px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
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
                    color: 'rgba(var(--almamundi-orange-rgb), 0.70)',
                    margin: 0,
                    fontFamily: SITE_FONT_STACK }}
                >
                  {kicker}
                </p>
                {question ? (
                  <p
                    style={{
                      fontSize: 'var(--fs-pequeno)',
                      lineHeight: 1.45,
                      color: 'rgba(255,255,255,0.78)',
                      margin: '8px 0 0',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    {question}
                  </p>
                ) : null}
                {alias ? (
                  <p
                    style={{
                      fontSize: 'var(--fs-etiqueta)',
                      color: 'rgba(255,255,255,0.72)',
                      margin: '8px 0 0',
                      fontFamily: SITE_FONT_STACK }}
                  >
                    {BY_LABEL[locale]} {alias}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={t.modalClose}
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.60)',
                  cursor: 'pointer',
                  fontSize: 'var(--fs-texto)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginLeft: 16 }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                padding: '24px 24px 28px',
                flex: '1 1 auto',
                minHeight: 0 }}
            >
              {item.kind === 'voz' && item.previewUrl ? (
                <audio controls preload="none" src={item.previewUrl} style={{ width: '100%', marginBottom: 16 }} />
              ) : null}
              {item.kind === 'foto' && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.contenido}
                  style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 16, marginBottom: 16, background: '#000' }}
                />
              ) : null}
              {item.contenido ? (
                <p
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontSize: 'var(--fs-texto)',
                    lineHeight: 1.85,
                    color: 'rgba(255,255,255,0.78)',
                    fontFamily: SITE_FONT_STACK }}
                >
                  {item.contenido}
                </p>
              ) : null}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginTop: 16 }}>
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
                <Link
                  href={preguntaPageHref(item.questionId)}
                  className="btn-am-secundario"
                  onClick={onClose}
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
                  {PREGUNTA_UI.responder[locale]}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EthicalShareFlow
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        authorName={alias || item.alias}
        storyTitle={question || kicker}
        quote={item.contenido}
        imageUrl={item.kind === 'foto' ? item.previewUrl ?? '' : ''}
        shareUrl={shareUrl}
        exhibitionLabel={KIND_LABEL[locale]}
      />
    </>
  );
}
