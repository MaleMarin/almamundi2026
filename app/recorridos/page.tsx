'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

import Link from 'next/link';
import { getRecorridos } from '@/lib/recorridos';
import { SITE_NAV_PILL_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

const soft = {
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px',
  },
} as const;

export default function RecorridosListPage() {
  const recorridos = getRecorridos();

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <HomeHardLink href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2" aria-label="AlmaMundi — inicio">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </HomeHardLink>
        <div className={historiasInterior.navLinksRowClassName}>
          <ActiveInternalNavLink href="/#proposito" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>Nuestro propósito</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>¿Cómo funciona?</ActiveInternalNavLink>
          <Link href="/historias" className={SITE_NAV_PILL_LINK_CLASS}>
            Historias
          </Link>
          <ActiveInternalNavLink href="/recorridos" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={neu.cardInset}>Recorridos</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>Mapa</ActiveInternalNavLink>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: neu.textMain }}>
          Recorridos
        </h1>
        <p className="text-lg font-light mb-2" style={{ color: neu.textBody }}>
          Historias que, juntas, trazan un camino.
        </p>
        <p className="text-base font-light mb-10" style={{ color: neu.textBody }}>
          Cada recorrido conecta voces que no se conocen, pero que comparten una experiencia.
        </p>

        <ul className="grid gap-6 sm:grid-cols-2">
          {recorridos.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/recorridos/${r.slug}`}
                className="block overflow-hidden rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                style={soft.flat}
              >
                <div className="relative aspect-[16/10] w-full bg-gray-300 overflow-hidden rounded-t-[40px]">
                  <img
                    src={r.cover}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: neu.textMain }}>
                    {r.title}
                  </h2>
                  <p className="text-sm font-light mb-3" style={{ color: neu.textBody }}>
                    {r.description}
                  </p>
                  <p className="text-sm font-medium mb-2" style={{ color: neu.textBody }}>
                    {r.items.length} pieza{r.items.length !== 1 ? 's' : ''}
                  </p>
                  <span className="inline-block text-orange-500 font-semibold text-sm">
                    Ver recorrido →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
      </div>
    </main>
  );
}
