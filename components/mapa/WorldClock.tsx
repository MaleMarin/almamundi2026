'use client';

import { useEffect, useMemo, useState } from 'react';

export type WorldClockLocation = {
  city?: string;
  country?: string;
  timezone?: string;
};

/** Zona horaria del navegador (ej. America/Santiago). */
function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Nombre de ciudad a partir del id de zona (ej. America/Santiago → SANTIAGO). */
function getCityFromTimeZone(timeZone: string): string {
  const part = timeZone.split('/').pop();
  if (!part) return 'LOCAL';
  return part.replace(/_/g, ' ').toUpperCase();
}

/** Abreviatura de zona horaria (ej. CLT, EST). */
function getTimeZoneShortName(now: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('es-CL', {
      timeZone,
      timeZoneName: 'short'
    }).formatToParts(now);
    const tz = parts.find((p) => p.type === 'timeZoneName');
    return tz?.value ?? '';
  } catch {
    return '';
  }
}

type Props = {
  selectedLocation?: WorldClockLocation | null;
};

export function WorldClock({ selectedLocation }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeZone = useMemo(() => getLocalTimeZone(), []);
  const cityLabel = useMemo(() => getCityFromTimeZone(timeZone), [timeZone]);

  const dateLine = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('es-CL', {
        timeZone,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
        .format(now)
        .replace(/\./g, '')
        .toUpperCase();
    } catch {
      return '';
    }
  }, [now, timeZone]);

  const timeLine = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('es-CL', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(now);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
      const tzShort = getTimeZoneShortName(now, timeZone);
      const hms = `${get('hour')}:${get('minute')}:${get('second')}`;
      return tzShort ? `${cityLabel} · ${hms} ${tzShort}` : `${cityLabel} · ${hms}`;
    } catch {
      return `${cityLabel} · —`;
    }
  }, [now, timeZone, cityLabel]);

  return (
    <div
      aria-hidden
      className="absolute left-1/2 bottom-7 z-30 pointer-events-none select-none text-center font-mono uppercase tracking-[0.2em] text-white/70 text-xs transition-opacity duration-500"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div className="mb-1">{dateLine}</div>
      <div>{timeLine}</div>
    </div>
  );
}
