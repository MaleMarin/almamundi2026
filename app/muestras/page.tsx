'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { MuestrasByTopic } from '@/lib/muestras-api';
import { getMuestras } from '@/lib/muestras';
import { MuestrasInteriorNav } from '@/components/muestras/MuestrasInteriorNav';
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
  const salasDemo = useMemo(() => getMuestras(), []);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <MuestrasInteriorNav />

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <header
          className="mb-6 w-full rounded-[24px] px-6 py-5 md:px-8 md:py-6"
          style={neu.cardProminent}
        >
          <h1
            className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
            style={{ color: neu.textMain }}
          >
            Muestras
          </h1>
        </header>
        <p className="text-lg font-light mb-2" style={{ color: neu.textBody }}>
          Curadurías que conectan historias del mundo.
        </p>
        <p className="text-base font-light mb-10" style={{ color: neu.textBody }}>
          Solo se muestran piezas ya aprobadas por curaduría.
        </p>

        <section
          className="mb-12 rounded-[28px] px-6 py-6 md:px-8 md:py-7"
          style={neu.cardInsetProminent}
          aria-label="Salas de muestra de demostración"
        >
          <div className="mb-4 w-full rounded-[18px] px-4 py-3 md:px-5 md:py-3.5" style={neu.cardProminent}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: neu.textMain }}>
              Salas curadas (demo)
            </h2>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--almamundi-orange)' }}>
              Curadas por Equipo de AlmaMundi
            </p>
          </div>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: neu.textBody }}>
            Tocá cada título (relieve neumórfico) para entrar a la sala, recorrer el hilo y abrir las historias de ejemplo.
          </p>
          <ul className="space-y-4">
            {salasDemo.map((m) => (
              <li key={m.slug} className="space-y-2">
                <Link
                  href={`/muestras/${m.slug}`}
                  className="block rounded-[22px] px-5 py-4 text-base font-semibold text-blue-600 transition-[box-shadow,transform] duration-200 hover:text-blue-800 active:scale-[0.99] md:text-lg"
                  style={neu.cardProminent}
                >
                  {m.title}
                </Link>
                {m.intro ? (
                  <p className="pl-1 text-sm font-light leading-snug" style={{ color: neu.textBody }}>
                    {m.intro}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {loading && (
          <p className="text-center py-12" style={{ color: neu.textBody }}>
            Cargando…
          </p>
        )}

        {error && (
          <div className="p-4 rounded-2xl mb-6 text-red-600 text-sm" style={neu.cardProminent}>
            {error}
          </div>
        )}

        {showEmpty && (
          <section
            className="py-16 px-8 rounded-[40px] text-center"
            style={neu.cardProminent}
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
                            style={neu.cardProminent}
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
      </div>
    </main>
  );
}
