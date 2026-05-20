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
 * Incluye sincronización día/noche según ubicación del usuario y nota sobre sonificación.
 * Uso: <TimeBar className="pointer-events-none ..." />
 */
import { useEffect, useMemo, useState } from 'react';
import WorldClock from '@/components/mapa/WorldClock';
import type { WorldClockLocation } from '@/components/mapa/WorldClock';
import { formatMapRealtimeSyncCaption } from '@/lib/sunPosition';

const HUD_CLASS =
  'text-[13px] md:text-[15px] tracking-[0.28em] text-slate-300/70 drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]';

/** Nota bajo fecha/hora: sonido en el vacío y sonificación (científica). */
const SPACE_SOUND_NOTE =
  'En el espacio no hay sonido porque no hay aire que lo transmita. Para estudiar eventos como explosiones, los científicos convierten datos de telescopios en frecuencias audibles — un proceso llamado sonificación.';

type Props = {
  selectedLocation?: WorldClockLocation | null;
  /** Coordenadas del usuario (GPS) para texto de sincronización día/noche. */
  viewerLat?: number | null;
  viewerLng?: number | null;
  className?: string;
};

function useLocalTimeZone(): string {
  const [tz, setTz] = useState('UTC');
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTz('UTC');
    }
  }, []);
  return tz;
}

export function TimeBar({ selectedLocation, className, viewerLat, viewerLng }: Props) {
  const browserTz = useLocalTimeZone();
  const location = useMemo<WorldClockLocation>(
    () => ({
      timezone: selectedLocation?.timezone ?? browserTz,
      city: selectedLocation?.city,
      country: selectedLocation?.country,
    }),
    [selectedLocation?.city, selectedLocation?.country, selectedLocation?.timezone, browserTz]
  );

  const [syncCaption, setSyncCaption] = useState(() =>
    formatMapRealtimeSyncCaption(new Date(), { userLat: viewerLat, userLng: viewerLng })
  );

  useEffect(() => {
    const tick = () =>
      setSyncCaption(formatMapRealtimeSyncCaption(new Date(), { userLat: viewerLat, userLng: viewerLng }));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [viewerLat, viewerLng]);

  return (
    <div className="pointer-events-none flex w-full max-w-[min(96vw,560px)] flex-col items-center gap-1.5 px-2 text-center">
      <WorldClock selectedLocation={location} className={className ?? HUD_CLASS} />
      <p className="m-0 max-w-full font-sans text-[11px] md:text-[12px] font-medium uppercase tracking-[0.12em] text-slate-300/75">
        {syncCaption.headline}
      </p>
      <p className="m-0 max-w-full font-sans text-[12px] md:text-[13px] leading-snug text-slate-400/90">
        {syncCaption.detail}
      </p>
      <p
        className="m-0 max-w-full font-sans font-normal normal-case italic text-[12px] md:text-[14px] leading-[1.48] text-slate-400/80"
      >
        {SPACE_SOUND_NOTE}
      </p>
    </div>
  );
}
