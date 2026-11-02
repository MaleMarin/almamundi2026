'use client';

import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_NAV_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';

/** «Preguntas para ti»: lleva a las cintas de la home (capítulo Inspírate). */
export function PreguntasNavMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { locale } = useHomeLocale();
  return (
    <HomeHardLink
      href="/#cintas"
      className={mobile ? `${SITE_NAV_LINK_CLASS} w-full justify-start text-left` : SITE_NAV_LINK_CLASS}
      onClick={onNavigate}
    >
      {HILOS_UI[locale].nav}
    </HomeHardLink>
  );
}
