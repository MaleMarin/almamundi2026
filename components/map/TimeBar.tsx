'use client';

/**
 * HUD Fecha/Hora/Ciudad del mapa. Usa WorldClock por dentro.
 * Solo se usa dentro del mapa; no hardcodear la fecha en otro sitio.
 *
 * REGLA (LOCKED) — para que no "se vaya al footer":
 * - No montar en app/layout.tsx
 * - No montar en Footer.tsx
 * - No usar position: fixed
 * - Siempre position: absolute dentro de UniverseStage (contenedor con position: relative)
 *
 * Uso: <TimeBar className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 ..." />
 */
import WorldClock from '@/components/mapa/WorldClock';
import type { WorldClockLocation } from '@/components/mapa/WorldClock';

const HUD_CLASS =
  'text-[11px] md:text-[12px] tracking-[0.32em] text-slate-300/70 drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]';

type Props = {
  selectedLocation?: WorldClockLocation | null;
  className?: string;
};

export function TimeBar({ selectedLocation, className }: Props) {
  return (
    <WorldClock
      selectedLocation={selectedLocation}
      className={className ?? HUD_CLASS}
    />
  );
}
