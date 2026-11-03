'use client';

import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_NAV_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';
import Link from 'next/link';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';

/** «Preguntas para ti» (cintas de AlmaMundi) y «Te preguntan» (preguntas que dejan las personas). */
export function PreguntasNavMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { locale } = useHomeLocale();
  const cls = mobile ? `${SITE_NAV_LINK_CLASS} w-full justify-start text-left` : SITE_NAV_LINK_CLASS;
  return (
    <>
      <HomeHardLink href="/#cintas" className={cls} onClick={onNavigate}>
        {HILOS_UI[locale].nav}
      </HomeHardLink>
      <Link href="/preguntas?tema=me-pregunto" className={cls} onClick={onNavigate}>
        {ME_PREGUNTO_UI[locale].navTePreguntan}
      </Link>
    </>
  );
}
