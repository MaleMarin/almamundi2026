'use client';

import { useState, useEffect } from 'react';

export function HighContrastToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('am-high-contrast') === 'true';
    setOn(saved);
    document.documentElement.setAttribute('data-high-contrast', String(saved));
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    document.documentElement.setAttribute('data-high-contrast', String(next));
    localStorage.setItem('am-high-contrast', String(next));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Desactivar alto contraste' : 'Activar alto contraste'}
      title={on ? 'Desactivar alto contraste' : 'Activar alto contraste'}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9998,
        background: on ? '#ffffff' : '#000000',
        color: on ? '#000000' : '#ffffff',
        border: '2px solid #FF4A1C',
        borderRadius: '100px',
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.05em',
      }}
    >
      {on ? 'AA ✓' : 'AA'}
    </button>
  );
}
