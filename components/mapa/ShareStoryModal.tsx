'use client';

import { useState } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';

type Mode = 'share' | 'postal';

export function ShareStoryModal({
  story,
  mode,
  onClose,
}: {
  story: StoryPoint;
  mode: Mode;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [anon, setAnon] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      await fetch(
        `/api/stories/${story.id}/${mode === 'share' ? 'share' : 'postal'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), anonymous: anon }),
        }
      );
      setSent(true);
    } catch {}
    setSending(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 92vw)',
          padding: '28px 24px',
          borderRadius: 22,
          background: 'rgba(8,12,25,0.95)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p
              style={{
                fontSize: 20,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.90)',
                margin: '0 0 8px',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
              }}
            >
              {mode === 'share' ? 'Enviado.' : 'Postal enviada.'}
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.40)',
                margin: '0 0 20px',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
              }}
            >
              {mode === 'share'
                ? 'Alguien recibirá esta historia.'
                : 'Llegará como correo real.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 22px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.60)',
                cursor: 'pointer',
                fontSize: 13,
                outline: 'none',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
              }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.90)',
                margin: '0 0 6px',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
              }}
            >
              {mode === 'share'
                ? 'Enviar esta historia a alguien'
                : 'Enviar como postal'}
            </p>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
                margin: '0 0 20px',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
                lineHeight: 1.5,
              }}
            >
              {mode === 'share'
                ? 'Recibirán un email que dice: "Alguien pensó en ti cuando leyó esto."'
                : 'Recibirán la historia como una postal con imagen y código QR.'}
            </p>

            <input
              type="email"
              placeholder="Email de la persona"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
                marginBottom: 12,
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = 'rgba(249,115,22,0.40)')
              }
              onBlur={(e) =>
                (e.target.style.borderColor = 'rgba(255,255,255,0.10)')
              }
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                marginBottom: 20,
                fontFamily: "'Avenir Light', Avenir, sans-serif",
              }}
            >
              <input
                type="checkbox"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
                style={{ accentColor: '#f97316' }}
              />
              <span
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}
              >
                Enviar de forma anónima
              </span>
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 999,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!email.trim() || sending}
                onClick={() => void send()}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 999,
                  background: email.trim()
                    ? 'rgba(249,115,22,0.20)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    email.trim()
                      ? 'rgba(249,115,22,0.40)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                  color: email.trim() ? '#fdba74' : 'rgba(255,255,255,0.25)',
                  cursor: email.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                  transition: 'all 180ms ease',
                }}
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
