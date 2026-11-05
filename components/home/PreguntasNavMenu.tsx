'use client';

import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_NAV_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';

/** «Inspírate» (5 nov 2026): lleva a la cortina de cintas, con las preguntas de AlmaMundi y las de las personas. */
export function PreguntasNavMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { t } = useHomeLocale();
  const cls = mobile ? `${SITE_NAV_LINK_CLASS} w-full justify-start text-left` : SITE_NAV_LINK_CLASS;
  return (
    <>
      <HomeHardLink href="/#cintas" className={cls} onClick={onNavigate}>
        {t.cejaInspira}
      </HomeHardLink>
    </>
  );
}
