'use client';

/**
 * /temas — Grid de temas (categorías). Neumorfismo.
 * Cada card enlaza a /temas/[slug] con historias de ese tema.
 */
import Link from 'next/link';
import { useStories } from '@/hooks/useStories';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { TEMAS } from '@/lib/temas-list';
import type { StoryPoint } from '@/lib/map-data/stories';

function normalizeTema(t: string | undefined): string {
  if (!t || typeof t !== 'string') return '';
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function countByTema(stories: StoryPoint[], slug: string): number {
  const slugNorm = slug.toLowerCase();
  return stories.filter((s) => {
    const topic = s.topic;
    if (!topic) return false;
    const n = normalizeTema(topic);
    return n === slugNorm || n.includes(slugNorm) || slugNorm.includes(n);
  }).length;
}

export default function TemasPage() {
  const stories = useStories();
  const baseList = stories.filter((s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo);

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
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold text-amber-700" style={neu.cardInset}>Temas</span>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <section className="px-6 md:px-12 pt-10 md:pt-14 pb-20 md:pb-28 max-w-5xl mx-auto">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase mb-3">Explorar por tema</p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-4" style={{ color: neu.textMain }}>
          ¿Qué quieres <span className="font-medium text-gray-500">encontrar?</span>
        </h1>
        <p className="text-base md:text-lg max-w-xl mb-10" style={{ color: neu.textBody }}>
          Cada experiencia humana tiene su lugar aquí.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {TEMAS.map((tema) => {
            const count = countByTema(baseList, tema.slug);
            return (
              <Link
                key={tema.slug}
                href={`/temas/${tema.slug}`}
                className="block p-5 md:p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] relative overflow-hidden"
                style={neu.card}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-70 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: tema.color }}
                />
                <div className="text-lg md:text-xl font-semibold tracking-tight mb-2 line-clamp-2" style={{ color: neu.textMain }}>
                  {tema.name}
                </div>
                {tema.description && (
                  <p className="text-sm leading-snug line-clamp-3 mb-2" style={{ color: neu.textBody }}>
                    {tema.description}
                  </p>
                )}
                <div className="text-[10px] font-medium tracking-wider uppercase" style={{ color: neu.textBody }}>
                  {count} {count === 1 ? 'historia' : 'historias'}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
        <Footer />
      </div>
    </main>
  );
}
