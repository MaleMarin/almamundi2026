'use client';

import {
  EXHIBITION_COMPROMISO_BODY,
  EXHIBITION_COMPROMISO_TITLE,
} from '@/lib/historias/exhibition-compromiso';

export type ExhibitionCompromisoVariant = 'band' | 'footer' | 'modal' | 'share-intro';

export function ExhibitionCompromisoStatement({
  variant,
  className = '',
  id,
  /** Solo aplica con `variant="band"`: contraste sobre sala clara (p. ej. /historias/videos). */
  bandTone = 'dark',
}: {
  variant: ExhibitionCompromisoVariant;
  className?: string;
  id?: string;
  bandTone?: 'dark' | 'light';
}) {
  const wrap =
    variant === 'band'
      ? bandTone === 'light'
        ? 'rounded-2xl border border-gray-300/50 bg-white/55 px-4 py-3 text-center shadow-sm backdrop-blur-md'
        : 'rounded-2xl border border-white/18 bg-white/[0.07] px-4 py-3 text-center backdrop-blur-md'
      : variant === 'footer'
        ? 'mx-auto max-w-3xl rounded-2xl border border-gray-300/60 bg-white/40 px-6 py-5 text-center shadow-sm backdrop-blur-sm'
        : variant === 'share-intro'
          ? 'mx-auto w-full max-w-md rounded-2xl border border-gray-300/70 bg-[#E8EAEE] px-6 py-6 text-center shadow-[0_12px_40px_rgba(15,20,30,0.12)]'
          : 'rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-center backdrop-blur-sm';

  const titleCls =
    variant === 'footer' || variant === 'share-intro'
      ? 'mb-3 text-[11px] font-normal uppercase tracking-[0.22em] text-gray-500'
      : variant === 'band'
        ? bandTone === 'light'
          ? 'text-[10px] font-normal uppercase tracking-[0.22em] text-gray-600'
          : 'text-[10px] font-normal uppercase tracking-[0.22em] text-white/55'
        : 'mb-2 text-[10px] font-normal uppercase tracking-[0.22em] text-white/55';

  const bodyCls =
    variant === 'footer' || variant === 'share-intro'
      ? 'font-serif text-base font-light italic leading-relaxed text-gray-700 md:text-lg'
      : 'font-serif text-sm font-light italic leading-relaxed text-white/88 sm:text-[15px]';

  return (
    <aside
      id={id}
      className={`${wrap} ${className}`}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <p id={id ? `${id}-heading` : undefined} className={titleCls}>
        {EXHIBITION_COMPROMISO_TITLE}
      </p>
      {variant === 'band' ? null : <p className={bodyCls}>{EXHIBITION_COMPROMISO_BODY}</p>}
    </aside>
  );
}
