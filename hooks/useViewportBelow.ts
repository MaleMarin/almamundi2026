'use client';

import { useEffect, useState } from 'react';

/**
 * `true` cuando `window.innerWidth` es estrictamente menor que `maxWidthPx`.
 * En SSR / primer render devuelve `false` hasta hidratar (igual que el estado inicial previo en MapFullPage).
 */
export function useViewportBelow(maxWidthPx: number): boolean {
  const [below, setBelow] = useState(false);

  useEffect(() => {
    const check = () => setBelow(window.innerWidth < maxWidthPx);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [maxWidthPx]);

  return below;
}
