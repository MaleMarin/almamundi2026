'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

/**
 * Smoke test: globo sin texturas, 1 punto. Si no aparece, el problema es SSR/altura/layout.
 * Activar en /mapa con ?smoke=1
 */
export default function GlobeSmokeTest() {
  const points = useMemo(
    () => [{ lat: -33.45, lng: -70.66, size: 0.6, color: '#F97316' }],
    []
  );

  return (
    <div style={{ width: '100%', height: '80vh', position: 'relative' }}>
      <Globe
        width={1200}
        height={800}
        backgroundColor="rgba(0,0,0,0)"
        pointsData={points}
        pointLat={(d: object) => (d as { lat: number }).lat}
        pointLng={(d: object) => (d as { lng: number }).lng}
        pointColor={(d: object) => (d as { color: string }).color}
        pointAltitude={(d: object) => (d as { size: number }).size}
      />
    </div>
  );
}
