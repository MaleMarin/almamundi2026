'use client';

/**
 * /historias/mi-coleccion — Historias guardadas por el usuario.
 * Ver, compartir y crear inspirado en lo guardado.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useMiColeccion, type SavedStory } from '@/hooks/useMiColeccion';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu } from '@/lib/historias-neumorph';

function formatLabel(format?: string): string {
  return { video: 'Video', audio: 'Audio', texto: 'Escritura', foto: 'Fotografía' }[format ?? ''] ?? format ?? '—';
}

export default function MiColeccionPage() {
  const { saved, remove } = useMiColeccion();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const shareStory = (s: SavedStory) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/historias/${s.id}` : '';
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

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
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold" style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Mi colección</span>
          <Link href="/historias/videos" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/historias/audios" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Audio</Link>
          <Link href="/historias/escrito" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Escrito</Link>
          <Link href="/historias/fotos" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Fotografía</Link>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <header className="flex-shrink-0 px-6 md:px-12 pt-8 md:pt-12 pb-4 md:pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--almamundi-orange)' }}>
          Tu colección
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
          Historias que guardaste.
        </h1>
        <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
          Compartilas o usalas como inspiración para crear la tuya.
        </p>
      </header>

      <section className="flex-1 px-6 md:px-12 pb-12">
        {saved.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={neu.cardInset}>
            <p className="text-gray-600 mb-4">Aún no guardaste ninguna historia.</p>
            <p className="text-sm text-gray-500 mb-6">En Videos o Audio, elegí una historia y hacé clic en &quot;Guardar en mi colección&quot;.</p>
            <Link href="/historias/videos" className="inline-block px-5 py-2.5 rounded-full text-sm font-medium" style={{ ...neu.button, color: neu.textMain }}>Ir a Historias</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
            {saved.map((s) => (
              <li key={s.id} className="rounded-2xl overflow-hidden" style={neu.card}>
                <Link href={`/historias/${s.id}`} className="block aspect-video bg-gray-200/50">
                  {s.thumbnailUrl || s.imageUrl ? (
                    <img src={s.thumbnailUrl ?? s.imageUrl ?? ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">📖</div>
                  )}
                </Link>
                <div className="p-4">
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--almamundi-orange)' }}>
                    {[s.city, s.country].filter(Boolean).join(', ') || '—'} · {formatLabel(s.format)}
                  </p>
                  <Link href={`/historias/${s.id}`}>
                    <h2 className="font-semibold tracking-tight text-gray-800 line-clamp-2 hover:underline">{s.title ?? 'Sin título'}</h2>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">{s.authorName ?? '—'}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => shareStory(s)}
                      style={{ color: 'var(--almamundi-orange)', borderColor: 'rgba(255, 69, 0, 0.5)' }}
                      className="text-xs font-medium px-3 py-1.5 rounded-full border hover:bg-orange-50"
                    >
                      {copiedId === s.id ? 'Copiado' : 'Compartir'}
                    </button>
                    <Link
                      href="/subir"
                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Crear inspirado en esta
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      className="text-xs text-gray-500 hover:text-red-600"
                      aria-label="Quitar de mi colección"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Footer />
    </main>
  );
}
