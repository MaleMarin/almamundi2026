'use client';

import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useHomeLocaleOptional } from '@/components/i18n/LocaleProvider';
import { NOT_FOUND_MESSAGES } from '@/lib/i18n/not-found-messages';
import Link from 'next/link';

const buttonClass =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-base font-semibold no-underline sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]';

export function NotFoundView() {
  const locale = useHomeLocaleOptional()?.locale ?? 'es';
  const t = NOT_FOUND_MESSAGES[locale];

  return (
    <main className="font-interna flex flex-1 items-center justify-center px-6 py-16 text-center text-[#1C1C2E]">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-[1.75rem] font-semibold leading-tight sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed sm:text-lg">{t.body}</p>
        <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
          <HomeHardLink
            href="/"
            className={`${buttonClass} bg-[#FF4A1C]`}
            style={{ color: '#ffffff' }}
          >
            {t.exploreMap}
          </HomeHardLink>
          <Link
            href="/contar"
            className={`${buttonClass} border border-[#FF4A1C] bg-white text-[#FF4A1C]`}
          >
            {t.tellStory}
          </Link>
        </div>
      </div>
    </main>
  );
}
