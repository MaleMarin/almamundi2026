'use client';

import { useDataSaverAutoplay } from '@/hooks/useDataSaverAutoplay';

const LABEL = 'No reproducir automáticamente en datos móviles';

export function DataSaverAutoplayToggle({
  variant = 'inline',
}: {
  variant?: 'inline' | 'compact';
}) {
  const { prefOn, setPrefOn, hydrated } = useDataSaverAutoplay();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        aria-pressed={hydrated ? prefOn : false}
        aria-label={LABEL}
        title={LABEL}
        onClick={() => setPrefOn(!prefOn)}
        style={{
          position: 'fixed',
          bottom: '58px',
          left: '20px',
          zIndex: 9998,
          background: prefOn ? '#ffffff' : '#000000',
          color: prefOn ? '#000000' : '#ffffff',
          border: '2px solid #FF4A1C',
          borderRadius: '100px',
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.02em',
          maxWidth: '11.5rem',
          lineHeight: 1.25,
          textAlign: 'left',
        }}
      >
        {prefOn ? 'Sin autoplay ✓' : 'Sin autoplay'}
      </button>
    );
  }

  return (
    <label className="mt-3 flex cursor-pointer items-start gap-2 text-left text-xs font-medium leading-snug text-gray-600 md:text-[0.8125rem]">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
        checked={hydrated ? prefOn : false}
        onChange={(e) => setPrefOn(e.target.checked)}
      />
      <span>{LABEL}</span>
    </label>
  );
}
