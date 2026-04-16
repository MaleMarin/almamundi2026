'use client';

import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

/**
 * Barra superior neumórfica alineada con `/muestras` (listado).
 * Usada en el listado y en `app/muestras/[slug]/layout.tsx` para salas como «el hilo».
 */
export function MuestrasInteriorNav() {
  return (
    <nav
      id="muestras-interior-nav"
      className={historiasInterior.navClassName}
      style={historiasInterior.navBarStyle}
    >
      <HomeHardLink
        href="/"
        className="flex min-w-0 flex-shrink-0 items-center pr-2"
        aria-label="AlmaMundi — inicio"
      >
        <img
          src={historiasInterior.logoSrc}
          alt="AlmaMundi"
          className={historiasInterior.logoClassName}
        />
      </HomeHardLink>
      <div className={historiasInterior.navLinksRowClassName}>
        <ActiveInternalNavLink
          href="/#proposito"
          className="btn-almamundi rounded-full px-4 py-2.5 text-sm md:text-[0.9375rem]"
          style={{ ...neu.button, color: neu.navLinkIdle }}
        >
          Nuestro propósito
        </ActiveInternalNavLink>
        <ActiveInternalNavLink
          href="/#como-funciona"
          className="btn-almamundi rounded-full px-4 py-2.5 text-sm md:text-[0.9375rem]"
          style={{ ...neu.button, color: neu.navLinkIdle }}
        >
          ¿Cómo funciona?
        </ActiveInternalNavLink>
        <HistoriasAccordion
          variant="header"
          buttonStyle={{ ...neu.button, color: neu.navLinkIdle }}
          className="[&_button]:btn-almamundi"
        />
        <ActiveInternalNavLink
          href="/muestras"
          className="btn-almamundi rounded-full px-4 py-2.5 text-sm md:text-[0.9375rem]"
          style={neu.cardInset}
        >
          Muestras
        </ActiveInternalNavLink>
        <ActiveInternalNavLink
          href="/#mapa"
          className="btn-almamundi rounded-full px-4 py-2.5 text-sm md:text-[0.9375rem]"
          style={{ ...neu.button, color: neu.navLinkIdle }}
        >
          Mapa
        </ActiveInternalNavLink>
      </div>
    </nav>
  );
}
