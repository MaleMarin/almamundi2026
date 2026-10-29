/**
 * Fecha de publicación idéntica en SSR y en el cliente.
 * El día sale del calendario ISO, con `timeZone: 'UTC'`, para no depender del huso.
 */

import type { AlmaLocale } from '@/lib/i18n/locale';
import { formatSiteDate } from '@/lib/i18n/site-intl';

/**
 * @returns Texto tipo «15 de marzo de 2024», o cadena vacía si no es parseable.
 */
export function formatPublishedAtEsStable(
  iso: string | undefined,
  locale: AlmaLocale = 'es'
): string {
  return formatSiteDate(iso, locale);
}
