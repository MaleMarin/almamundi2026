'use client';

import { useEffect, useState } from 'react';

export type Pulse = {
  id: string;
  lat: number;
  lng: number;
  storyId: string;
  createdAt: string | null;
};

/**
 * Carga las huellas recientes del servidor cada 30 segundos.
 * Las huellas son los rings dorados en el mapa (ondas que se expanden y desaparecen).
 */
export function usePulses(active: boolean): Pulse[] {
  const [pulses, setPulses] = useState<Pulse[]>([]);

  useEffect(() => {
    if (!active) return;

    const load = async () => {
      try {
        const res = await fetch('/api/pulse');
        const data = (await res.json()) as { pulses: Pulse[] };
        setPulses(data.pulses ?? []);
      } catch {
        // Silencioso — las huellas son decorativas
      }
    };

    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [active]);

  return pulses;
}
