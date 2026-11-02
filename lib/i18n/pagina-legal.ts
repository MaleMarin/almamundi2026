import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { LEGAL_DOCS } from '@/lib/i18n/legal-documents';

export async function localeDeLaPagina() {
  const jar = await cookies();
  return parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value);
}

export async function metaLegal(
  clave: 'privacidad' | 'terminos' | 'contacto' | 'conducta'
): Promise<Metadata> {
  const locale = await localeDeLaPagina();
  const doc = LEGAL_DOCS[locale][clave];
  return {
    title: doc.title,
    description: doc.lede ?? doc.title,
  };
}
