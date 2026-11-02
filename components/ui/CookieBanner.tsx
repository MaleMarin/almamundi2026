'use client';

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { uiMessages, useHomeLocaleOptional } from '@/components/i18n/LocaleProvider';
import {
  aplicarConsentimiento,
  guardarConsentimiento,
  leerConsentimiento,
  retirarConsentimientoViejo,
  type ConsentValor,
} from '@/lib/ads-consent';

export function CookieBanner() {
  const t = useHomeLocaleOptional()?.t ?? uiMessages('es');
  const [visible, setVisible] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      retirarConsentimientoViejo();
      const guardado = leerConsentimiento();
      if (guardado?.valor === 'aceptar') void aplicarConsentimiento('aceptar');
      if (!guardado) queueMicrotask(() => setVisible(true));
    } catch {
      queueMicrotask(() => setVisible(true));
    }
    const abrir = () => setVisible(true);
    window.addEventListener('am-consent-open', abrir);
    return () => window.removeEventListener('am-consent-open', abrir);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const body = document.body;
    const prev = body.style.paddingBottom;
    const el = panelRef.current;
    if (!visible || !el) {
      body.style.paddingBottom = '';
      return () => {
        body.style.paddingBottom = prev;
      };
    }
    const apply = () => {
      const alto = el.getBoundingClientRect().height;
      body.style.paddingBottom = `${Math.ceil(alto + 16)}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      body.style.paddingBottom = prev;
    };
  }, [visible, narrow]);

  if (!visible) return null;

  const panel: CSSProperties = {
    position: 'fixed',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 40,
    maxWidth: 960,
    margin: '0 auto',
    boxSizing: 'border-box',
    background: '#e6e9ee',
    borderRadius: 14,
    padding: '12px 20px',
    display: 'flex',
    alignItems: narrow ? 'stretch' : 'center',
    flexDirection: narrow ? 'column' : 'row',
    gap: 12,
    border: '1px solid rgba(163,177,198,0.35)',
    maxHeight: narrow ? '40vh' : undefined,
    overflow: narrow ? 'auto' : undefined,
  };

  const textStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: '#5a6070',
    lineHeight: 1.4,
    margin: 0,
    flex: narrow ? '0 0 auto' : 1,
    minWidth: 0,
  };

  const linkStyle: CSSProperties = {
    color: '#FF4A1C',
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.4,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textAlign: narrow ? 'center' : 'left',
  };

  const buttonStyle: CSSProperties = {
    background: '#FF4A1C',
    color: 'white',
    border: '1.5px solid #FF4A1C',
    padding: '0 18px',
    height: 36,
    boxSizing: 'border-box',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    fontFamily: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: narrow ? 'calc(50% - 6px)' : 'auto',
  };

  function elegir(valor: ConsentValor) {
    try {
      guardarConsentimiento(valor);
      void aplicarConsentimiento(valor);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div ref={panelRef} style={panel} role="region" aria-label={t.cookieAria}>
      <p style={textStyle}>{t.cookieBody}</p>
      {narrow ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: 12,
            rowGap: 12,
            width: '100%',
          }}
        >
          <button type="button" style={buttonStyle} onClick={() => elegir('aceptar')}>
            {t.cookieAccept}
          </button>
          <button type="button" style={buttonStyle} onClick={() => elegir('rechazar')}>
            {t.cookieDecline}
          </button>
          <a href="/privacidad" style={{ ...linkStyle, flexBasis: '100%' }}>
            {t.cookiePrivacyLink}
          </a>
        </div>
      ) : (
        <>
          <span
            style={{
              display: 'inline-grid',
              gridAutoFlow: 'column',
              gridAutoColumns: '1fr',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button type="button" style={{ ...buttonStyle, width: '100%' }} onClick={() => elegir('aceptar')}>
              {t.cookieAccept}
            </button>
            <button type="button" style={{ ...buttonStyle, width: '100%' }} onClick={() => elegir('rechazar')}>
              {t.cookieDecline}
            </button>
          </span>
          <a href="/privacidad" style={linkStyle}>
            {t.cookiePrivacyLink}
          </a>
        </>
      )}
    </div>
  );
}
