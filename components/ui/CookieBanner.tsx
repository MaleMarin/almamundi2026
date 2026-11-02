'use client';

import { useState, useEffect } from 'react';
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
    const mq = window.matchMedia('(max-width: 599px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const body = document.body;
    const prev = body.style.paddingBottom;
    if (visible) {
      body.style.paddingBottom = narrow ? '128px' : '88px';
    } else {
      body.style.paddingBottom = prev || '';
    }
    return () => {
      body.style.paddingBottom = prev || '';
    };
  }, [visible, narrow]);

  if (!visible) return null;

  const panel: CSSProperties = {
    position: 'fixed',
    bottom: 8,
    left: 12,
    right: 12,
    zIndex: 40,
    maxWidth: 640,
    margin: '0 auto',
    boxSizing: 'border-box',
    background: '#e6e9ee',
    borderRadius: 12,
    padding: narrow ? '12px 14px' : '12px 18px',
    display: 'flex',
    alignItems: 'center',
    flexDirection: narrow ? 'column' : 'row',
    gap: narrow ? 10 : 16,
    border: '1px solid rgba(163,177,198,0.35)',
  };

  const textStyle: CSSProperties = {
    fontSize: 'var(--fs-pequeno)',
    fontWeight: 500,
    color: '#5a6070',
    lineHeight: 1.45,
    margin: 0,
  };

  const linkStyle: CSSProperties = {
    color: '#FF4A1C',
    fontWeight: 600,
    fontSize: 'var(--fs-pequeno)',
    textDecoration: 'none',
  };

  const buttonStyle: CSSProperties = {
    background: '#FF4A1C',
    color: 'white',
    border: '1.5px solid #FF4A1C',
    padding: '7px 16px',
    borderRadius: 100,
    fontSize: 'var(--fs-pequeno)',
    fontWeight: 600,
    lineHeight: 1.2,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: narrow ? 0 : 112,
    alignSelf: narrow ? 'stretch' : 'auto',
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
    <div style={panel} role="region" aria-label={t.cookieAria}>
      <p style={textStyle}>{t.cookieBody}</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button type="button" style={buttonStyle} onClick={() => elegir('aceptar')}>
          {t.cookieAccept}
        </button>
        <button type="button" style={buttonStyle} onClick={() => elegir('rechazar')}>
          {t.cookieDecline}
        </button>
        <a href="/privacidad" style={linkStyle}>
          {t.cookiePrivacyLink}
        </a>
      </div>
    </div>
  );
}
