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
 * Incluye nota en 8px cursiva bajo fecha/hora (sonido en el vacío / sonificación).
 * Uso: <TimeBar className="pointer-events-none ..." />
 */
import WorldClock from '@/components/mapa/WorldClock';
import type { WorldClockLocation } from '@/components/mapa/WorldClock';

const HUD_CLASS =
  'text-[11px] md:text-[12px] tracking-[0.32em] text-slate-300/70 drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]';

/** Nota bajo fecha/hora: sonido en el vacío y sonificación (científica). */
const SPACE_SOUND_NOTE =
  'En el espacio no hay sonido porque es una onda mecánica que necesita un medio físico como el aire para propagarse, y el vacío espacial carece de las partículas necesarias para transmitir esas vibraciones. Para poder «escuchar» eventos como explosiones, los científicos utilizan la sonificación, un proceso que traduce datos digitales de telescopios y radiación electromagnética en frecuencias audibles para detectar patrones y facilitar el estudio de fenómenos invisibles.';

type Props = {
  selectedLocation?: WorldClockLocation | null;
  className?: string;
};

export function TimeBar({ selectedLocation, className }: Props) {
  return (
    <div className="pointer-events-none flex w-full max-w-[min(96vw,560px)] flex-col items-center gap-1.5 px-2 text-center">
      <WorldClock selectedLocation={selectedLocation} className={className ?? HUD_CLASS} />
      <p
        className="m-0 max-w-full font-sans font-normal normal-case italic text-[8px] leading-[1.35] text-slate-400/80"
      >
        {SPACE_SOUND_NOTE}
      </p>
    </div>
  );
}
