'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';

const NOTICE = {
  pt: 'Este documento está disponível em espanhol. Se precisar de ajuda, escreva para hola@almamundi.org.',
  en: 'This document is available in Spanish. If you need help, write to hola@almamundi.org.',
} as const;

export function LegalLanguageNotice() {
  const { locale } = useHomeLocale();
  if (locale === 'es') return null;
  return (
    <p role="note" style={{ margin: '0 0 1.25rem', color: '#4a5568', lineHeight: 1.5 }}>
      {NOTICE[locale]}
    </p>
  );
}
