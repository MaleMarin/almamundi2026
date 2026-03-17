'use client';

/**
 * /temas — Grid de temas (categorías). Neumorfismo.
 * Cada card enlaza a /temas/[slug] con historias de ese tema.
 */
import Link from 'next/link';
import { useStories } from '@/hooks/useStories';
import { neu } from '@/lib/historias-neumorph';
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
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="text-lg font-light tracking-wide" style={{ color: neu.textMain }}>AlmaMundi</Link>
        <div className="flex items-center gap-2">
          <Link href="/#intro" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <Link href="/historias" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textBody }}>Historias</Link>
          <span className="px-4 py-2 rounded-full text-sm font-medium text-amber-700" style={neu.cardInset}>Temas</span>
          <Link href="/#mapa" className="px-4 py-2 rounded-full text-sm" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-700 uppercase mb-3">Explorar por tema</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight mb-3" style={{ color: neu.textMain }}>
          ¿Qué querés <em className="italic opacity-70">encontrar?</em>
        </h1>
        <p className="text-lg max-w-xl mb-10" style={{ color: neu.textBody }}>
          Cada experiencia humana tiene su lugar aquí.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
                <div className="font-serif text-xl md:text-2xl font-normal mb-1" style={{ color: neu.textMain }}>
                  {tema.name}
                </div>
                <div className="text-[10px] font-medium tracking-wider uppercase" style={{ color: neu.textBody }}>
                  {count} {count === 1 ? 'historia' : 'historias'}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-gray-300/40 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="font-medium mb-1" style={{ color: neu.textMain }}>AlmaMundi</div>
          <div className="text-xs" style={{ color: neu.textBody }}>Una iniciativa de PRECISAR</div>
        </div>
        <div className="flex gap-6">
          <Link href="/#intro" className="text-sm" style={{ color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/historias" className="text-sm" style={{ color: neu.textBody }}>Historias</Link>
          <Link href="/#mapa" className="text-sm" style={{ color: neu.textBody }}>Mapa</Link>
        </div>
      </footer>
    </main>
  );
}
