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

  useEffect(() => {
    const body = document.body;
    const prev = body.style.paddingBottom;
    if (visible) {
      body.style.paddingBottom = narrow ? '92px' : '72px';
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
    maxWidth: 560,
    margin: '0 auto',
    boxSizing: 'border-box',
    background: '#e6e9ee',
    borderRadius: 12,
    padding: narrow ? '10px 14px' : '10px 18px',
    display: 'flex',
    alignItems: 'center',
    flexDirection: narrow ? 'column' : 'row',
    gap: narrow ? 10 : 16,
    border: '1px solid rgba(163,177,198,0.35)',
  };

  const textStyle: CSSProperties = {
    fontSize: 12,
    color: '#5a6070',
    lineHeight: 1.45,
    margin: 0,
  };

  const linkStyle: CSSProperties = {
    color: '#FF4A1C',
    textDecoration: 'none',
  };

  const buttonStyle: CSSProperties = {
    background: '#FF4A1C',
    color: 'white',
    border: 'none',
    padding: '7px 16px',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    alignSelf: narrow ? 'stretch' : 'auto',
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
        AlmaMundi usa cookies esenciales y analítica básica.{' '}
        <a href="/privacidad" style={linkStyle}>
          Política de privacidad
        </a>
        .
      </p>
      <button type="button" style={buttonStyle} onClick={onAccept}>
        Entendido
      </button>
    </div>
  );
}
