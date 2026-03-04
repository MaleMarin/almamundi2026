'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAtmosphere, type Atmosphere } from '@/lib/timeAtmosphere';

/**
 * Hook que:
 * 1. Lee la hora actual (o overrideHour si se pasa, ej. para ?hour=22) y retorna la atmósfera
 * 2. Aplica las CSS variables a :root para que todo el sitio cambie
 * 3. Se actualiza cada minuto (sin refetch de datos)
 * 4. Expone el slot actual para que otros componentes reaccionen
 *
 * @param overrideHour - Hora 0–23 para forzar atmósfera (ej. desde ?hour=22). Solo para pruebas.
 */
export function useAtmosphere(overrideHour?: number) {
  const [atm, setAtm] = useState<Atmosphere>(() => getAtmosphere(overrideHour));

  const apply = useCallback((a: Atmosphere) => {
    if (typeof document === 'undefined') return;
    const r = document.documentElement;

    // Intensidad del fondo (oscurece/aclara el overlay del universo)
    r.style.setProperty('--atm-bg-intensity',      String(a.bgIntensity));
    r.style.setProperty('--atm-particle-speed',    String(a.particleSpeed));
    r.style.setProperty('--atm-particle-opacity',  String(a.particleOpacity));
    r.style.setProperty('--atm-ambient-vol',       String(a.ambientVolume));

    // Color de acento dinámico (hsl)
    r.style.setProperty('--atm-accent-hue',        String(a.accentHue));
    r.style.setProperty('--atm-accent-sat',        `${a.accentSaturation}%`);
    r.style.setProperty('--atm-accent',            `hsl(${a.accentHue}, ${a.accentSaturation}%, 55%)`);
    r.style.setProperty('--atm-accent-glow',       a.glowColor);

    // Overlay del fondo
    r.style.setProperty('--atm-bg-overlay',        a.bgOverlay);

    // Slot como data-attribute (para selectors CSS opcionales)
    document.documentElement.setAttribute('data-slot', a.slot);
  }, []);

  useEffect(() => {
    const update = () => {
      const next = getAtmosphere(overrideHour);
      setAtm(next);
      apply(next);
    };
    update();
    if (overrideHour != null) return; // con hora fija no actualizamos cada minuto
    const id = setInterval(update, 60_000); // cada minuto
    return () => clearInterval(id);
  }, [apply, overrideHour]);

  return atm;
}
