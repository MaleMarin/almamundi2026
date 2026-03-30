'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatMapRealtimeSyncCaption } from '@/lib/sunPosition';

type Props = {
  userLat?: number | null;
  userLng?: number | null;
};

/**
 * Leyenda bajo el HUD del mapa: terminador / tiempo real (Chile u otra zona).
 */
export function MapRealtimeSyncLine({ userLat, userLng }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { headline, detail } = useMemo(
    () => formatMapRealtimeSyncCaption(now, { userLat, userLng }),
    [now, userLat, userLng]
  );

  return (
    <div className="pointer-events-none mt-2 max-w-[min(96vw,42rem)] px-2 text-center font-sans text-[10px] leading-relaxed tracking-wide text-slate-400/90 md:text-[11px]">
      <div className="font-semibold uppercase tracking-[0.22em] text-slate-300/95">{headline}</div>
      <div className="mt-1 normal-case tracking-normal text-slate-400/85">{detail}</div>
    </div>
  );
}
