'use client';

import { useEffect, useState } from 'react';
import { getApproxLocation } from '@/lib/userLocation';
import { isViewerNightNow } from '@/lib/viewer-solar-night';

/**
 * Día/noche del globo según dónde está quien mira.
 * Reusa `getApproxLocation` (cacheada, sin IP). Si el home ya la pidió, no vuelve a preguntar.
 */
export function useViewerSolarNight(
  viewerLat?: number | null,
  viewerLng?: number | null
): boolean {
  const [approx, setApprox] = useState<{ lat: number; lng: number } | null>(null);
  const lat = viewerLat ?? approx?.lat ?? null;
  const lng = viewerLng ?? approx?.lng ?? null;

  const [night, setNight] = useState(() =>
    typeof window === 'undefined' ? false : isViewerNightNow(viewerLat, viewerLng)
  );

  useEffect(() => {
    if (viewerLat != null && viewerLng != null) return;
    let cancelled = false;
    void getApproxLocation().then((loc) => {
      if (!cancelled && loc) setApprox({ lat: loc.lat, lng: loc.lng });
    });
    return () => {
      cancelled = true;
    };
  }, [viewerLat, viewerLng]);

  useEffect(() => {
    const tick = () => setNight(isViewerNightNow(lat, lng));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [lat, lng]);

  return night;
}
