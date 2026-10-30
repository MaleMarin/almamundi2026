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

/** Nombre de ciudad a partir del id de zona (fallback cuando no hay geolocalización). */
function getCityFromTimeZone(timeZone: string): string {
  if (timeZone === 'America/Santiago') return 'REGIÓN METROPOLITANA';
  const part = timeZone.split('/').pop();
  if (!part) return 'LOCAL';
  return part.replace(/_/g, ' ').toUpperCase();
}

/** La misma región del reloj, en frase. Sin lugar si la zona no dice una ciudad. */
export function visitorGreetingPlace(): string | null {
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
  const label = getCityFromTimeZone(timeZone);
  if (!label || label === 'LOCAL' || label === 'UTC') return null;
  return label.toLowerCase().replace(/(^|\s)([a-záéíóúüñ])/gi, (chunk, space: string, letter: string) => {
    return `${space}${letter.toUpperCase()}`;
  });
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
  /** En true, texto gris y bloque estático (para fondo claro, ej. footer). */
  light?: boolean;
  /** Clases extra (ej. HUD: text-slate-300/70). Si se pasa, no se usa posición absoluta. */
  className?: string;
};

function WorldClockInner({ selectedLocation, light, className }: Props) {
  /** null hasta el primer tick en cliente: evita hydration mismatch (SSR vs cliente difieren en el segundo). */
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeZone = useMemo(() => selectedLocation?.timezone ?? getLocalTimeZone(), [selectedLocation?.timezone]);
  const cityLabel = useMemo(
    () => selectedLocation?.city ?? getCityFromTimeZone(timeZone),
    [selectedLocation?.city, timeZone]
  );

  const dateLine = useMemo(() => {
    if (!now) return '';
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
    if (!now) return '';
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
      return cityLabel || '';
    }
  }, [now, timeZone, cityLabel]);

  const oneLine = [dateLine, timeLine].filter(Boolean).join(' · ');

  const isStatic = Boolean(className);
  const base = 'pointer-events-none select-none text-center font-mono uppercase whitespace-nowrap';
  const resolvedClassName =
    className != null
      ? `${base} ${className}`
      : light
        ? `${base} tracking-[0.2em] text-gray-500 text-[length:var(--fs-etiqueta)]`
        : `absolute left-1/2 z-30 tracking-[0.2em] text-white/70 text-[length:var(--fs-etiqueta)] transition-opacity duration-500 ${base}`;

  return (
    <div
      aria-hidden
      className={resolvedClassName}
      style={!isStatic && !light ? { transform: 'translateX(-50%)', bottom: '0.25rem' } : undefined}
    >
      {/* Espacio reservado: mismo alto que una línea para evitar salto al montar la hora. */}
      {oneLine || '\u00A0'}
    </div>
  );
}

export { WorldClockInner as WorldClock };
export default WorldClockInner;
