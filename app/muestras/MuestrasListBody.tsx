'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { MuestrasByTopic } from '@/lib/muestras-api';
import { getMuestras } from '@/lib/muestras';
import { MuestrasInteriorNav } from '@/components/muestras/MuestrasInteriorNav';
import { MuestrasSalaEntranceLink } from '@/components/muestras/MuestrasSalaEntranceLink';
import { neu } from '@/lib/historias-neumorph';

export function MuestrasListBody() {
  const [topics, setTopics] = useState<MuestrasByTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.classList.remove('lenis-stopped');
  }, []);

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
    <main
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: neu.bg,
        fontFamily: neu.APP_FONT,
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(255, 74, 28, 0.14) 0%, rgba(255, 74, 28, 0.04) 28%, transparent 52%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% min(70vh, 640px)',
      }}
    >
      <MuestrasInteriorNav />

      <div className="mx-auto max-w-5xl px-6 pb-16 pt-4 md:px-12 md:pt-6">
        <header
          className="mb-6 w-full rounded-[24px] px-6 py-5 md:px-8 md:py-6"
          style={neu.cardProminent}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1
              className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
              style={{ color: neu.textMain }}
            >
              Muestras
            </h1>
            <Link
              href="/muestras"
              className="btn-almamundi shrink-0 self-start rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] sm:self-center"
              style={{
                background: '#FF4A1C',
                color: '#fff',
                boxShadow: '6px 6px 14px rgba(163,177,198,0.45), -4px -4px 12px rgba(255,255,255,0.5)',
              }}
            >
              Recorrido cinematográfico
            </Link>
          </div>
        </header>
        <p className="mb-2 text-lg font-light" style={{ color: neu.textBody }}>
          Curadurías que conectan historias del mundo.
        </p>
        <p className="mb-6 text-base font-light" style={{ color: neu.textBody }}>
          Solo se muestran piezas ya aprobadas por curaduría.
        </p>

        <p className="mb-8 text-sm leading-relaxed" style={{ color: neu.textBody }}>
          El recorrido cinematográfico (pantalla completa, GSAP, fondo 3D) es la{' '}
          <Link href="/muestras" className="font-semibold text-blue-600 underline-offset-2 hover:text-blue-800 hover:underline">
            entrada principal en /muestras
          </Link>
          . Esta página es el listado extendido y las salas demo.
        </p>

        <section
          className="mb-12 rounded-[28px] px-6 py-6 md:px-8 md:py-7"
          style={neu.cardInsetProminent}
          aria-label="Salas de muestra de demostración"
        >
          <div
            className="mb-4 w-full rounded-[18px] px-4 py-3 md:px-5 md:py-3.5"
            style={neu.cardProminent}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-[0.14em]"
              style={{ color: neu.textMain }}
            >
              Salas curadas (demo)
            </h2>
            <p
              className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              Curadas por Equipo de AlmaMundi
            </p>
          </div>
          <p className="mb-5 text-sm leading-relaxed" style={{ color: neu.textBody }}>
            Tocá cada título (relieve neumórfico) para entrar a la sala, recorrer el hilo y abrir las
            historias de ejemplo.{' '}
            <MuestrasSalaEntranceLink
              href="/muestras/el-hilo"
              className="font-medium text-blue-600 underline-offset-2 hover:text-blue-800 hover:underline"
            >
              Atajo: /muestras/el-hilo
            </MuestrasSalaEntranceLink>{' '}
            abre la misma sala tipo hilo (demo).
          </p>
          <ul className="space-y-4">
            {salasDemo.map((m) => (
              <li key={m.slug} className="space-y-2">
                <MuestrasSalaEntranceLink
                  href={`/muestras/${m.slug}`}
                  className="block rounded-[22px] px-5 py-4 text-base font-semibold text-blue-600 transition-[box-shadow,transform] duration-200 hover:text-blue-800 active:scale-[0.99] md:text-lg"
                  style={neu.cardProminent}
                >
                  {m.title}
                </MuestrasSalaEntranceLink>
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
          <p className="py-12 text-center" style={{ color: neu.textBody }}>
            Cargando…
          </p>
        )}

        {error && (
          <div className="mb-6 rounded-2xl p-4 text-sm text-red-600" style={neu.cardProminent}>
            {error}
          </div>
        )}

        {showEmpty && (
          <section className="rounded-[40px] px-8 py-16 text-center" style={neu.cardProminent}>
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
                    <h2
                      className="mb-4 text-lg font-semibold uppercase tracking-wider"
                      style={{ color: neu.textMain }}
                    >
                      {t.topicLabel}
                    </h2>
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {t.items.map((item) => (
                        <li key={item.id}>
                          <article
                            className="block overflow-hidden rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                            style={neu.cardProminent}
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[40px] bg-gray-300">
                              <img
                                src={item.publicUrl}
                                alt=""
                                className="h-full w-full object-cover"
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
                                <p className="mt-0.5 text-sm" style={{ color: neu.textBody }}>
                                  {item.dateTaken}
                                </p>
                              )}
                              {item.context && (
                                <p className="mt-1 line-clamp-2 text-sm" style={{ color: neu.textBody }}>
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

      <div className="border-t border-gray-400/50 pt-10 md:pt-14" />
    </main>
  );
}
