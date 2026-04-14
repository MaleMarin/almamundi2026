'use client';

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

const STORAGE_KEY = 'am-cookies-ok';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return;
      queueMicrotask(() => setVisible(true));
    } catch {
      queueMicrotask(() => setVisible(true));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 599px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!visible) return null;

  const panel: CSSProperties = narrow
    ? {
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        transform: 'none',
        zIndex: 9990,
        maxWidth: 600,
        margin: '0 auto',
        boxSizing: 'border-box',
        background: '#e6e9ee',
        borderRadius: 16,
        boxShadow: '8px 8px 16px #c4c7cd, -8px -8px 16px #ffffff',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        gap: 20,
        whiteSpace: 'normal',
      }
    : {
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9990,
        maxWidth: 600,
        width: 'min(600px, calc(100% - 32px))',
        boxSizing: 'border-box',
        background: '#e6e9ee',
        borderRadius: 16,
        boxShadow: '8px 8px 16px #c4c7cd, -8px -8px 16px #ffffff',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 20,
        whiteSpace: 'nowrap',
      };

  const textStyle: CSSProperties = {
    fontSize: 13,
    color: '#5a6070',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: narrow ? 'normal' : 'nowrap',
  };

  const linkStyle: CSSProperties = {
    color: '#FF4A1C',
    textDecoration: 'none',
  };

  const buttonStyle: CSSProperties = {
    background: '#FF4A1C',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const onAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div style={panel} role="region" aria-label="Aviso de cookies">
      <p style={textStyle}>
        AlmaMundi usa cookies esenciales y analítica básica.
        <br />
        Ver nuestra{' '}
        <a href="/privacidad" style={linkStyle}>
          política de privacidad
        </a>
        .
      </p>
      <button type="button" style={buttonStyle} onClick={onAccept}>
        Entendido
      </button>
    </div>
  );
}
