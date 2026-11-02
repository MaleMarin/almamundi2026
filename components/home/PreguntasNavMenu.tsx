'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_NAV_LINK_CLASS, SITE_NAV_STORIES_ITEM_CLASS } from '@/components/layout/siteNavLinkStyles';
import { HILOS } from '@/lib/hilos';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';

const TODAS = { es: 'Todas', pt: 'Todas', en: 'All' } as const;

/** «Preguntas para ti» en el menú: Todas y los 12 temas (cada uno abre sus preguntas). */
export function PreguntasNavMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { locale } = useHomeLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, mobile]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const items = (
    <>
      <Link href="/preguntas" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={close}>
        {TODAS[locale]}
      </Link>
      {HILOS.map((hilo) => (
        <Link
          key={hilo.id}
          href={`/preguntas?p=${encodeURIComponent(hilo.id)}`}
          className={SITE_NAV_STORIES_ITEM_CLASS}
          onClick={close}
        >
          {hilo.nombre[locale]}
        </Link>
      ))}
    </>
  );

  return (
    <div className={mobile ? '' : 'relative'} ref={ref}>
      <button
        type="button"
        className={mobile ? `${SITE_NAV_LINK_CLASS} w-full justify-start text-left` : SITE_NAV_LINK_CLASS}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        {HILOS_UI[locale].nav}
      </button>
      {open ? (
        <div
          id={listId}
          className={
            mobile
              ? 'grid grid-cols-2 gap-x-2 pl-2'
              : 'absolute left-0 top-[calc(100%+0.35rem)] z-[110] grid min-w-[16rem] grid-cols-2 gap-x-2 rounded-[14px] border border-[#DDD8D1] bg-[#FBFAF8] p-2 shadow-[0_12px_28px_rgba(120,110,100,0.18)]'
          }
        >
          {items}
        </div>
      ) : null}
    </div>
  );
}
