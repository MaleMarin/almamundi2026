'use client';

/**
 * /historias/escrito — Listado de historias en texto. Mismo header (acordeón) que videos/audios/fotos.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useStories } from '@/hooks/useStories';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import type { StoryPoint } from '@/lib/map-data/stories';

function isTextStory(s: StoryPoint): boolean {
  return Boolean(s.body || s.hasText || (s as StoryPoint & { content?: string }).content);
}

export default function HistoriasEscritoPage() {
  const allStories = useStories();
  const textStories = useMemo(() => {
    return allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isTextStory(s)
    );
  }, [allStories]);

  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <Link href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </Link>
        <div className={historiasInterior.navLinksRowClassName}>
          <Link href="/#intro" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi [&_button]:text-base [&_button]:md:text-lg [&_button]:px-5 [&_button]:py-3 [&_button]:md:px-6" />
          <span className={historiasInterior.navActiveClassName} style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Escritos</span>
          <Link href="/historias/videos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/historias/audios" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Audios</Link>
          <Link href="/historias/fotos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Fotografías</Link>
          <Link href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className={historiasInterior.contentWrapClassName}>
      <header className={historiasInterior.headerClassName}>
        <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--almamundi-orange)' }}>
          Historias escritas
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
          Palabras que cuentan.
        </h1>
        <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
          Estas son algunas.
        </p>
      </header>

      <section className={`flex-1 px-6 md:px-12 pb-16 md:pb-20 ${historiasInterior.sectionGrowClassName}`}>
        {textStories.length === 0 ? (
          <p className="text-gray-600">No hay historias escritas por ahora.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
            {textStories.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/historias/${s.id}/texto`}
                  className="block rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={neu.card}
                >
                  <div className="aspect-video bg-gray-200/50 flex items-center justify-center">
                    {s.thumbnailUrl || s.imageUrl ? (
                      <img src={(s.thumbnailUrl ?? s.imageUrl) as string} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-50">📖</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--almamundi-orange)' }}>
                      {[s.city, s.country].filter(Boolean).join(', ') || '—'}
                    </p>
                    <h2 className="font-semibold tracking-tight text-gray-800 line-clamp-2">{s.title ?? 'Sin título'}</h2>
                    {(() => {
                      const raw = s.excerpt ?? s.description ?? (s.body ?? (s as StoryPoint & { content?: string }).content ?? '');
                      const text = String(raw).replace(/\s+/g, ' ').trim().slice(0, 150);
                      return text ? (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {text}{String(raw).length > 150 ? '…' : ''}
                        </p>
                      ) : null;
                    })()}
                    <p className="text-sm text-gray-600 mt-1">{s.authorName ?? s.author?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.max(1, Math.ceil(((s.body ?? (s as StoryPoint & { content?: string }).content ?? '').split(/\s+/).filter(Boolean).length) / 200))} min de lectura
                    </p>
                    <span className="inline-block mt-3 text-xs font-medium" style={{ color: 'var(--almamundi-orange)' }}>Leer →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      <Footer />
    </main>
  );
}
