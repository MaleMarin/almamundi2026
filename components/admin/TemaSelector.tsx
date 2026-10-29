'use client';

import { EJES, temasDeEje } from '@/lib/temas';
import { SITE_FONT_STACK } from '@/lib/typography';

export function TemaSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    if (value.length >= 3) return;
    onChange([...value, id]);
  };

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: SITE_FONT_STACK }}>
        Temas ({value.length}/3)
      </p>
      {EJES.map((eje) => (
        <div key={eje.id}>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: SITE_FONT_STACK,
            }}
          >
            {eje.es}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {temasDeEje(eje.id).map((tema) => {
              const on = value.includes(tema.id);
              return (
                <button
                  key={tema.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && value.length >= 3}
                  onClick={() => toggle(tema.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: on ? '1px solid #FF4A1C' : '1px solid rgba(255,255,255,0.2)',
                    background: on ? 'rgba(255,74,28,0.22)' : 'rgba(255,255,255,0.06)',
                    color: on ? '#FF6E49' : 'rgba(255,255,255,0.82)',
                    fontSize: 12,
                    fontFamily: SITE_FONT_STACK,
                    cursor: !on && value.length >= 3 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {tema.es}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
