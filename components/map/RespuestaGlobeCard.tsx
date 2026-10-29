'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ShareAfterNotice } from '@/components/stories/ShareAfterNotice';
import { preguntaAlias } from '@/lib/i18n/pregunta-messages';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { preguntaPageHref, preguntaPorId, preguntaTexto, RESPONDE_TU_LABEL } from '@/lib/pregunta-semana';
import type { RespuestaPublica } from '@/lib/respuestas/public';
import { isShortCode } from '@/lib/short-code';
import { SITE_FONT_STACK } from '@/lib/typography';
import { bindGlobePanelScroll, globePanelHasMore, placeGlobeStoryPanel } from '@/components/map/globeStoryPanel';

const KIND_LABEL = { es: 'Respuesta', pt: 'Resposta', en: 'Answer' } as const;
const SHARE_LABEL = { es: 'Compartir', pt: 'Compartilhar', en: 'Share' } as const;
const BY_LABEL = { es: 'Por', pt: 'Por', en: 'By' } as const;

export function RespuestaGlobeCard({
  item,
  onClose }: {
  item: RespuestaPublica;
  onClose: () => void;
}) {
  const { locale, t } = useHomeLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreBelow, setMoreBelow] = useState(false);
  const pregunta = preguntaPorId(item.questionId);
  const question = preguntaTexto(item.questionId, 'tu', locale);
  const place = formatPublicPlace(item.city, item.country);
  const kicker = [KIND_LABEL[locale], pregunta?.tema[locale], place].filter(Boolean).join(' · ');
  const alias = preguntaAlias(item.alias);

  useEffect(() => {
    if (!item.id || isShortCode(item.shortCode)) return;
    void fetch(`/api/respuestas/public/${encodeURIComponent(item.id)}`, { cache: 'no-store' }).catch(
      () => undefined
    );
  }, [item.id, item.shortCode]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const placePanel = () => placeGlobeStoryPanel(panel);
    placePanel();
    window.addEventListener('scroll', placePanel, true);
    window.addEventListener('resize', placePanel);
    return () => {
      window.removeEventListener('scroll', placePanel, true);
      window.removeEventListener('resize', placePanel);
    };
  }, [item.id]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const el = scrollRef.current;
    if (!panel || !el) return;
    const syncMore = () => setMoreBelow(globePanelHasMore(el));
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
  }, [item.id]);

  const panel = (
      <div ref={panelRef} className="story-map-panel">
        <div className="story-map-panel__card">
          <div
            className="story-map-panel__sheet"
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
              ref={scrollRef}
              className="story-map-panel__scroll"
              style={{
                position: 'relative',
                zIndex: 2,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                padding: '24px 24px 24px',
                flex: '1 1 auto',
                minHeight: 0,
                overscrollBehavior: 'contain',
                touchAction: 'pan-y' }}
            >
              {item.kind === 'voz' && item.previewUrl ? (
                <audio controls preload="none" src={item.previewUrl} style={{ width: '100%', marginBottom: 16 }} />
              ) : null}
              {item.kind === 'foto' && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.contenido}
                  style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 16, marginBottom: 16, background: 'var(--home-bg)' }}
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
              <div aria-hidden style={{ height: 32, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 8, marginTop: 0 }}>
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
                    justifyContent: 'center',
                    textAlign: 'center' }}
                >
                  {SHARE_LABEL[locale]}
                </button>
                <Link
                  href={preguntaPageHref(item.questionId)}
                  className="btn-am-secundario"
                  style={{
                    minHeight: 44,
                    padding: '8px 16px',
                    fontFamily: SITE_FONT_STACK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center' }}
                >
                  {RESPONDE_TU_LABEL[locale]}
                </Link>
              </div>
            </div>
            {moreBelow ? <div className="story-map-panel__more" aria-hidden /> : null}
          </div>
        </div>
      </div>
  );
  const target = typeof document !== 'undefined' ? document.querySelector('.map-section-atmosphere') : null;

  return (
    <>
      {target instanceof HTMLElement ? createPortal(panel, target) : panel}
      <ShareAfterNotice
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        kind="answer"
        answerId={item.id}
        questionId={item.questionId}
        shortCode={item.shortCode}
        question={question ?? ''}
        answerKind={item.kind}
      />
    </>
  );
}
