'use client';

import Link from 'next/link';
import { getExposiciones } from '@/lib/exposiciones';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

export default function ExposicionesListPage() {
  const expos = getExposiciones();

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <Link href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2" aria-label="AlmaMundi — inicio">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </Link>
        <div className={historiasInterior.navLinksRowClassName}>
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold text-amber-700" style={neu.cardInset}>Exposiciones</span>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: neu.textMain }}>
          Exposiciones
        </h1>
        <p className="text-lg font-light mb-10" style={{ color: neu.textBody }}>
          Colecciones de piezas para explorar.
        </p>

        <ul className="flex flex-col gap-6">
          {expos.map((expo) => (
            <li key={expo.id}>
              <Link
                href={`/exposiciones/${expo.slug}`}
                className="block p-6 md:p-8 rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                style={neu.card}
              >
                <h2 className="text-xl md:text-2xl font-semibold mb-2" style={{ color: neu.textMain }}>
                  {expo.titulo}
                </h2>
                {expo.descripcion && (
                  <p className="text-base font-light mb-3" style={{ color: neu.textBody }}>
                    {expo.descripcion}
                  </p>
                )}
                <p className="text-sm font-medium" style={{ color: neu.textBody }}>
                  {expo.piezas.length} pieza{expo.piezas.length !== 1 ? 's' : ''}
                  {expo.vigencia ? ` · ${expo.vigencia}` : ''}
                </p>
                <span className="inline-block mt-4 text-orange-500 font-semibold text-sm">
                  Entrar a la sala →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
        <Footer />
      </div>
    </main>
  );
}
