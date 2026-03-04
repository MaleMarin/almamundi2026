'use client';

const AMBIENT_OPTS = [
  { id: 'universo' as const, label: 'Universo', desc: 'Sonido del espacio' },
  { id: 'mar' as const, label: 'Mar', desc: 'Olas, calma' },
  { id: 'ciudad' as const, label: 'Ciudad', desc: 'Urbano, presente' },
  { id: 'viento' as const, label: 'Viento', desc: 'Aire, naturaleza' },
];

export type SoundsPanelProps = {
  currentMood: string;
  onMoodChange: (m: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
};

export function SoundsPanel({
  currentMood,
  onMoodChange,
  soundEnabled,
  onToggleSound,
}: SoundsPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Cortar sonido' : 'Activar sonido'}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: soundEnabled ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.06)',
            color: soundEnabled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: "'Avenir Light', Avenir, sans-serif",
            outline: 'none',
            transition: 'all 200ms ease',
          }}
        >
          {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {AMBIENT_OPTS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMoodChange(m.id)}
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: 12,
              background: currentMood === m.id ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${currentMood === m.id ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.07)'}`,
              borderLeft: currentMood === m.id ? '3px solid rgba(249,115,22,0.6)' : '3px solid transparent',
              cursor: 'pointer',
              opacity: 1,
              transition: 'all 200ms ease',
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              width: '100%',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <p style={{ fontSize: 15, fontWeight: currentMood === m.id ? 500 : 300, color: currentMood === m.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)', margin: 0, fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
              {m.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
