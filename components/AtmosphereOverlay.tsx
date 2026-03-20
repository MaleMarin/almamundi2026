'use client';

import { useAtmosphere } from '@/hooks/useAtmosphere';
import { useEffect, useState } from 'react';
import { setAmbientBaseVolume } from '@/lib/sound/ambient';

/**
 * Overlay cinematográfico de atmósfera temporal.
 * - Aplica CSS variables a :root (vía useAtmosphere)
 * - Gestiona el volumen del ambient según la hora
 * - Muestra un overlay de color suave sobre el universo
 * - Muestra la etiqueta poética del momento (aparece y desaparece)
 *
 * MONTAJE: una sola vez en el layout del mapa.
 * NO reemplaza UniverseBackground — va encima de él.
 */
export function AtmosphereOverlay({
  soundEnabled,
  hourOverride,
  embedded,
}: {
  soundEnabled: boolean;
  /** Hora 0–23 para forzar atmósfera (ej. /mapa?hour=22). Solo pruebas. */
  hourOverride?: number;
  /** En home (#mapa): no pintar overlay; el fondo lo define el globo (universo). */
  embedded?: boolean;
}) {
  const atm = useAtmosphere(hourOverride);

  // Ajustar volumen del ambient según atmósfera cuando el sonido está habilitado (o al activarlo)
  useEffect(() => {
    if (!soundEnabled) return;
    setAmbientBaseVolume(atm.ambientVolume, 3000);
  }, [atm.ambientVolume, soundEnabled]);

  return (
    <>
      {/* Overlay cromático: full page = var; embedded = degradado arriba del mapa (no quitar) */}
      <div
        aria-hidden
        style={{
          position: embedded ? 'absolute' : 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: embedded
            ? 'linear-gradient(to bottom, rgba(12,18,32,0.7) 0%, rgba(10,14,26,0.35) 20%, transparent 55%)'
            : 'linear-gradient(to bottom, rgba(12,18,32,0.5) 0%, rgba(10,14,26,0.2) 12%, transparent 22%)',
          transition: 'background 4000ms ease',
        }}
      />

      {/* Etiqueta poética del momento — solo la frase, desaparece sola */}
      
    </>
  );
}

// Reserved for overlay labels; unused in current UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future use
function AtmosphereLabel({ label }: { label: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    const id2 = setTimeout(() => setVisible(false), 4000);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(id2);
    };
  }, [label]);

  if (!label) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'none',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1500ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      <p style={{
        fontSize: 28,
        fontWeight: 300,
        color: 'rgba(255,255,255,0.75)',
        margin: 0,
        letterSpacing: '-0.01em',
        fontFamily: 'var(--font-sans)',
        textShadow: '0 2px 40px rgba(0,0,0,0.9)',
      }}>
        {label}
      </p>
    </div>
  );
}
