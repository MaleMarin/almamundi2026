'use client';

import { useEffect } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import type { AlmaLocale } from '@/lib/i18n/locale';

/**
 * Al abrir /proposito, /pt/proposito o /en/proposito, el encabezado y el pie
 * toman el idioma de la página. La URL no cambia: no es una redirección.
 */
export function PropositoLocaleSync({ locale }: { locale: AlmaLocale }) {
  const { locale: actual, setLocale } = useHomeLocale();
  useEffect(() => {
    if (actual !== locale) setLocale(locale);
    // Solo al entrar a la página o cambiar de versión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
  return null;
}
