'use client';

/**
 * /historias/fotos — Listado de historias en fotografía. Mismo header (acordeón) que videos/audios/escrito.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useStories } from '@/hooks/useStories';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu } from '@/lib/historias-neumorph';
import type { StoryPoint } from '@/lib/map-data/stories';

function isPhotoStory(s: StoryPoint): boolean {
  const sp = s as StoryPoint & { images?: string[]; imagenes?: unknown[]; photos?: unknown[] };
  return Boolean(s.imageUrl || sp.images?.length || sp.imagenes?.length || sp.photos?.length);
}

function photoCount(s: StoryPoint): number {
  const sp = s as StoryPoint & { images?: string[]; imagenes?: { url: string }[]; photos?: { url: string }[] };
  if (sp.images?.length) return sp.images.length;
  if (sp.imagenes?.length) return sp.imagenes.length;
  if (sp.photos?.length) return sp.photos.length;
  return s.imageUrl ? 1 : 0;
}

export default function HistoriasFotosPage() {
  const allStories = useStories();
  const photoStories = useMemo(() => {
    return allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isPhotoStory(s)
    );
  }, [allStories]);

  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 md:py-6 min-h-[4.25rem] md:min-h-[4.75rem] border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="flex items-center flex-shrink-0">
          <img src="/logo.png" alt="AlmaMundi" className="h-10 md:h-12 w-auto object-contain select-none" />
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold" style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Fotografía</span>
          <Link href="/historias/videos" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/historias/audios" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Audio</Link>
          <Link href="/historias/escrito" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Escrito</Link>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <header className="flex-shrink-0 px-6 md:px-12 pt-8 md:pt-12 pb-4 md:pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--almamundi-orange)' }}>
          Historias en fotografía
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
          Imágenes que cuentan.
        </h1>
        <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
          Estas son algunas.
        </p>
      </header>

      <section className="flex-1 px-6 md:px-12 pb-12">
        {photoStories.length === 0 ? (
          <p className="text-gray-600">No hay historias en fotografía por ahora.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
            {photoStories.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/historias/${s.id}/foto`}
                  className="block rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={neu.card}
                >
                  <div className="aspect-video bg-gray-200/50 flex items-center justify-center">
                    {s.thumbnailUrl || s.imageUrl ? (
                      <img src={(s.thumbnailUrl ?? s.imageUrl) as string} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-50">📷</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--almamundi-orange)' }}>
                      {[s.city, s.country].filter(Boolean).join(', ') || '—'}
                      {photoCount(s) > 0 && ` · ${photoCount(s)} ${photoCount(s) === 1 ? 'foto' : 'fotos'}`}
                    </p>
                    <h2 className="font-semibold tracking-tight text-gray-800 line-clamp-2">{s.title ?? 'Sin título'}</h2>
                    <p className="text-sm text-gray-600 mt-1">{s.authorName ?? s.author?.name ?? '—'}</p>
                    <span className="inline-block mt-3 text-xs font-medium" style={{ color: 'var(--almamundi-orange)' }}>Ver álbum →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Footer />
    </main>
  );
}
