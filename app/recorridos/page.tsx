'use client';

import Link from 'next/link';
import { getRecorridos } from '@/lib/recorridos';

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

export default function RecorridosListPage() {
  const recorridos = getRecorridos();

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
          Recorridos
        </h1>
        <p className="text-lg font-light mb-2" style={{ color: soft.textBody }}>
          Historias que, juntas, trazan un camino.
        </p>
        <p className="text-base font-light mb-10" style={{ color: soft.textBody }}>
          Cada recorrido conecta voces que no se conocen, pero que comparten una experiencia.
        </p>

        <ul className="grid gap-6 sm:grid-cols-2">
          {recorridos.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/recorridos/${r.slug}`}
                className="block overflow-hidden rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                style={soft.flat}
              >
                <div className="relative aspect-[16/10] w-full bg-gray-300 overflow-hidden rounded-t-[40px]">
                  <img
                    src={r.cover}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: soft.textMain }}>
                    {r.title}
                  </h2>
                  <p className="text-sm font-light mb-3" style={{ color: soft.textBody }}>
                    {r.description}
                  </p>
                  <p className="text-sm font-medium mb-2" style={{ color: soft.textBody }}>
                    {r.items.length} pieza{r.items.length !== 1 ? 's' : ''}
                  </p>
                  <span className="inline-block text-orange-500 font-semibold text-sm">
                    Ver recorrido →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
