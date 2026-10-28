'use client';

import { useEffect, useState } from 'react';
import { isViewerNightNow } from '@/lib/viewer-solar-night';

/**
 * Día/noche del globo según las coordenadas que pase quien mira,
 * o la capital de su zona horaria si no hay coordenadas.
 */
export function useViewerSolarNight(
  viewerLat?: number | null,
  viewerLng?: number | null
): boolean {
  const [night, setNight] = useState(() =>
    typeof window === 'undefined' ? false : isViewerNightNow(viewerLat, viewerLng)
  );

  useEffect(() => {
    const tick = () => setNight(isViewerNightNow(viewerLat, viewerLng));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [viewerLat, viewerLng]);

  return night;
}
