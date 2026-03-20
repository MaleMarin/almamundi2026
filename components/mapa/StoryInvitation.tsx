'use client';

import { useEffect, useState } from 'react';
import { getStoriesRead } from '@/lib/sessionTracker';
import { SITE_FONT_STACK } from '@/lib/typography';

type Props = {
  onInvite: () => void;
};

export function StoryInvitation({ onInvite }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const count = getStoriesRead();
    if (count >= 2) {
      const id = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(id);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        marginTop: 60,
        padding: '40px 0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
        animation: 'storyFadeIn 800ms ease-out both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        <div style={{ flex: 1, maxWidth: 80, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 18, opacity: 0.4 }}>✦</span>
        <div style={{ flex: 1, maxWidth: 80, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      <p
        style={{
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 12px',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          fontFamily: SITE_FONT_STACK,
        }}
      >
        ¿Hay algo tuyo que podría vivir aquí?
      </p>

      <p
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.35)',
          margin: '0 0 28px',
          fontFamily: SITE_FONT_STACK,
        }}
      >
        Cada historia que llega a AlmaMundi viene de alguien real.
      </p>

      <button
        type="button"
        onClick={onInvite}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 28px',
          borderRadius: 999,
          background: 'rgba(249,115,22,0.12)',
          border: '1px solid rgba(249,115,22,0.28)',
          color: '#fdba74',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.02em',
          fontFamily: SITE_FONT_STACK,
          transition: 'all 250ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(249,115,22,0.20)';
          e.currentTarget.style.borderColor = 'rgba(249,115,22,0.50)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(249,115,22,0.12)';
          e.currentTarget.style.borderColor = 'rgba(249,115,22,0.28)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Sí, quiero contarlo →
      </button>
    </div>
  );
}
