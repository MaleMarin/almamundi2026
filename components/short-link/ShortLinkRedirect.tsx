'use client';

import { useEffect } from 'react';
import type { AlmaLocale } from '@/lib/i18n/locale';

const NOTICE = {
  es: 'Abriendo la historia en el mapa…',
  pt: 'Abrindo a história no mapa…',
  en: 'Opening the story on the map…',
} as const;

function canShowGlobe(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

export function ShortLinkRedirect({
  locale,
  globeHref,
  lightHref,
}: {
  locale: AlmaLocale;
  globeHref: string;
  lightHref: string;
}) {
  useEffect(() => {
    window.location.replace(canShowGlobe() ? globeHref : lightHref);
  }, [globeHref, lightHref]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-6">
      <p className="text-center text-[length:var(--fs-texto)] text-[#141D26]">{NOTICE[locale]}</p>
    </main>
  );
}
