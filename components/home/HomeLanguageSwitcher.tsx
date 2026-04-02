'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ALMA_LOCALES, type AlmaLocale } from '@/lib/i18n/locale';

function labelFor(locale: AlmaLocale, t: { langShortEs: string; langShortPt: string; langShortEn: string }) {
  if (locale === 'es') return t.langShortEs;
  if (locale === 'pt') return t.langShortPt;
  return t.langShortEn;
}

export function HomeLanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useHomeLocale();

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 rounded-full border border-white/40 bg-[#E0E5EC]/90 px-1 py-0.5 shadow-sm backdrop-blur-sm ${className}`}
      role="group"
      aria-label={t.ariaLanguage}
    >
      {ALMA_LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={`min-w-[2rem] rounded-full px-2 py-1 text-[11px] font-bold tracking-wide transition-colors ${
              active
                ? 'bg-gray-600 text-white'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
            }`}
          >
            {labelFor(code, t)}
          </button>
        );
      })}
    </div>
  );
}
