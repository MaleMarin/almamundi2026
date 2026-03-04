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
  if (timeZone === 'America/Santiago') return 'TUNQUÉN';
  const part = timeZone.split('/').pop();
  if (!part) return 'LOCAL';
  return part.replace(/_/g, ' ').toUpperCase();
}

/** Reverse geocoding con Nominatim para obtener ciudad desde lat/lng. */
async function getCityFromCoords(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'es',
        'User-Agent': 'AlmaMundi-Mapa/1.0 (https://almamundi.cl)',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: { city?: string; town?: string; village?: string; state?: string; municipality?: string } };
    const a = data.address;
    if (!a) return null;
    const name = a.city ?? a.town ?? a.village ?? a.municipality ?? a.state ?? null;
    return name ? String(name).toUpperCase() : null;
  } catch {
    return null;
  }
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
  const [now, setNow] = useState<Date>(() => new Date());
  const [geoCity, setGeoCity] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Coordenadas reales con navigator.geolocation y ciudad vía Nominatim (solo cuando no hay selectedLocation)
  useEffect(() => {
    if (selectedLocation?.city) return;
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        getCityFromCoords(lat, lon).then((city) => {
          if (!cancelled && city) setGeoCity(city);
        });
      },
      () => {},
      { timeout: 8000, maximumAge: 300_000, enableHighAccuracy: false }
    );
    return () => { cancelled = true; };
  }, [selectedLocation?.city]);

  const timeZone = useMemo(() => selectedLocation?.timezone ?? getLocalTimeZone(), [selectedLocation?.timezone]);
  const cityLabel = useMemo(
    () => selectedLocation?.city ?? geoCity ?? getCityFromTimeZone(timeZone),
    [selectedLocation?.city, geoCity, timeZone]
  );

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

  const oneLine = [dateLine, timeLine].filter(Boolean).join(' · ');

  const isStatic = Boolean(className);
  const base = 'pointer-events-none select-none text-center font-mono uppercase whitespace-nowrap';
  const resolvedClassName =
    className != null
      ? `${base} ${className}`
      : light
        ? `${base} tracking-[0.2em] text-gray-500 text-xs`
        : `absolute left-1/2 z-30 tracking-[0.2em] text-white/70 text-xs transition-opacity duration-500 ${base}`;

  return (
    <div
      aria-hidden
      className={resolvedClassName}
      style={!isStatic && !light ? { transform: 'translateX(-50%)', bottom: '0.25rem' } : undefined}
    >
      {oneLine}
    </div>
  );
}

export { WorldClockInner as WorldClock };
export default WorldClockInner;
