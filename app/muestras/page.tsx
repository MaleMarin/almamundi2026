'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MuestrasByTopic } from '@/lib/muestras-api';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu } from '@/lib/historias-neumorph';

export default function MuestrasListPage() {
  const [topics, setTopics] = useState<MuestrasByTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/muestras')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.detail || data.error);
          setTopics([]);
        } else {
          setTopics(data.topics ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar');
          setTopics([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasAnyItem = !loading && !error && topics.some((t) => t.items.length > 0);
  const showEmpty = !loading && !error && !hasAnyItem;

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 md:py-6 min-h-[4.25rem] md:min-h-[4.75rem] border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: neu.textMain }}>AlmaMundi</Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold text-amber-700" style={neu.cardInset}>Muestras</span>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: neu.textMain }}>
          Muestras
        </h1>
        <p className="text-lg font-light mb-2" style={{ color: neu.textBody }}>
          Curadurías que conectan historias del mundo.
        </p>
        <p className="text-base font-light mb-10" style={{ color: neu.textBody }}>
          Solo se muestran piezas ya aprobadas por curaduría.
        </p>

        {loading && (
          <p className="text-center py-12" style={{ color: neu.textBody }}>
            Cargando…
          </p>
        )}

        {error && (
          <div className="p-4 rounded-2xl mb-6 text-red-600 text-sm" style={neu.card}>
            {error}
          </div>
        )}

        {showEmpty && (
          <section
            className="py-16 px-8 rounded-[40px] text-center"
            style={neu.card}
          >
            <p className="text-xl font-light" style={{ color: neu.textMain }}>
              Aún no hay muestras publicadas.
            </p>
            <p className="mt-2 text-base font-light" style={{ color: neu.textBody }}>
              Cuando la curaduría apruebe piezas, aparecerán aquí agrupadas por tema.
            </p>
          </section>
        )}

        {hasAnyItem && (
          <div className="space-y-12">
            {topics.map(
              (t) =>
                t.items.length > 0 && (
                  <section key={t.topic}>
                    <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider" style={{ color: neu.textMain }}>
                      {t.topicLabel}
                    </h2>
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {t.items.map((item) => (
                        <li key={item.id}>
                          <article
                            className="block overflow-hidden rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                            style={neu.card}
                          >
                            <div className="relative aspect-[4/3] w-full bg-gray-300 overflow-hidden rounded-t-[40px]">
                              <img
                                src={item.publicUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="p-5">
                              <p className="font-semibold" style={{ color: neu.textMain }}>
                                {item.alias}
                              </p>
                              {item.dateTaken && (
                                <p className="text-sm mt-0.5" style={{ color: neu.textBody }}>
                                  {item.dateTaken}
                                </p>
                              )}
                              {item.context && (
                                <p className="text-sm mt-1 line-clamp-2" style={{ color: neu.textBody }}>
                                  {item.context}
                                </p>
                              )}
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
        <Footer />
      </div>
    </main>
  );
}
