'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ALMA_LOCALE_COOKIE,
  type AlmaLocale,
} from '@/lib/i18n/locale';
import { HOME_MESSAGES, type HomeMessages } from '@/lib/i18n/home-messages';

type LocaleContextValue = {
  locale: AlmaLocale;
  setLocale: (next: AlmaLocale) => void;
  t: HomeMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AlmaLocale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AlmaLocale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: AlmaLocale) => {
      if (typeof document !== 'undefined') {
        document.cookie = `${ALMA_LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
      }
      setLocaleState(next);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
      router.refresh();
    },
    [router]
  );

  const t = useMemo(() => HOME_MESSAGES[locale], [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useHomeLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useHomeLocale debe usarse dentro de LocaleProvider');
  }
  return ctx;
}
