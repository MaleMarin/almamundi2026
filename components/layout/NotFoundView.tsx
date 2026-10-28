'use client';

import { useHomeLocaleOptional } from '@/components/i18n/LocaleProvider';
import { NOT_FOUND_MESSAGES } from '@/lib/i18n/not-found-messages';
import Link from 'next/link';

const cardClass =
  'flex min-h-11 flex-col items-start gap-1 rounded-2xl border border-[#E7E2D6] bg-white px-5 py-4 text-left no-underline transition hover:border-[#FF4A1C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]';

export function NotFoundView() {
  const locale = useHomeLocaleOptional()?.locale ?? 'es';
  const t = NOT_FOUND_MESSAGES[locale];

  return (
    <main className="font-interna flex flex-1 items-center justify-center px-6 py-16 text-center text-[#1C1C2E]">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-[length:var(--fs-titular)] font-normal leading-tight ">{t.lead}</h1>
        <div className="mx-auto mt-8 grid w-full max-w-lg gap-3 sm:max-w-none sm:grid-cols-2">
          <Link href="/mapa" className={cardClass}>
            <span className="text-[length:var(--fs-pequeno)] font-semibold text-[#FF4A1C]">{t.mapTitle}</span>
            <span className="text-[length:var(--fs-pequeno)] leading-snug text-[#5C5C52]">{t.mapBody}</span>
          </Link>
          <Link href="/historias" className={cardClass}>
            <span className="text-[length:var(--fs-pequeno)] font-semibold text-[#FF4A1C]">{t.storiesTitle}</span>
            <span className="text-[length:var(--fs-pequeno)] leading-snug text-[#5C5C52]">{t.storiesBody}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
