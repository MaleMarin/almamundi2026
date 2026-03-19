'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MuestrasByTopic } from '@/lib/muestras-api';

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px',
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT,
  },
} as const;

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
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-24 bg-[#E0E5EC]/80 backdrop-blur-lg border-b border-white/20">
        <Link href="/" className="flex items-center min-h-[60px]">
          <img
            src="/logo.png"
            alt="AlmaMundi"
            className="h-20 md:h-24 w-auto object-contain select-none"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.nextElementSibling) return;
              const span = document.createElement('span');
              span.className = 'text-xl font-light text-gray-600';
              span.textContent = 'AlmaMundi';
              t.style.display = 'none';
              t.parentElement?.appendChild(span);
            }}
          />
        </Link>
        <nav className="flex gap-4 text-sm font-bold text-gray-600 items-center">
          <Link href="/" className="btn-almamundi px-6 py-3 active:scale-95 rounded-full" style={soft.button}>
            Inicio
          </Link>
          <Link href="/#mapa" className="btn-almamundi px-6 py-3 active:scale-95 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: soft.textMain }}>
          Muestras
        </h1>
        <p className="text-lg font-light mb-2" style={{ color: soft.textBody }}>
          Curadurías que conectan historias del mundo.
        </p>
        <p className="text-base font-light mb-10" style={{ color: soft.textBody }}>
          Solo se muestran piezas ya aprobadas por curaduría.
        </p>

        {loading && (
          <p className="text-center py-12" style={{ color: soft.textBody }}>
            Cargando…
          </p>
        )}

        {error && (
          <div className="p-4 rounded-2xl mb-6 text-red-600 text-sm" style={soft.flat}>
            {error}
          </div>
        )}

        {showEmpty && (
          <section
            className="py-16 px-8 rounded-[40px] text-center"
            style={soft.flat}
          >
            <p className="text-xl font-light" style={{ color: soft.textMain }}>
              Aún no hay muestras publicadas.
            </p>
            <p className="mt-2 text-base font-light" style={{ color: soft.textBody }}>
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
                    <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider" style={{ color: soft.textMain }}>
                      {t.topicLabel}
                    </h2>
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {t.items.map((item) => (
                        <li key={item.id}>
                          <article
                            className="block overflow-hidden rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                            style={soft.flat}
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
                              <p className="font-semibold" style={{ color: soft.textMain }}>
                                {item.alias}
                              </p>
                              {item.dateTaken && (
                                <p className="text-sm mt-0.5" style={{ color: soft.textBody }}>
                                  {item.dateTaken}
                                </p>
                              )}
                              {item.context && (
                                <p className="text-sm mt-1 line-clamp-2" style={{ color: soft.textBody }}>
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
    </main>
  );
}
