'use client';

import Link from 'next/link';
import { getExposiciones } from '@/lib/exposiciones';

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

export default function ExposicionesListPage() {
  const expos = getExposiciones();

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
          <Link href="/" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Inicio
          </Link>
          <Link href="/#mapa" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: soft.textMain }}>
          Exposiciones
        </h1>
        <p className="text-lg font-light mb-10" style={{ color: soft.textBody }}>
          Colecciones de piezas para explorar.
        </p>

        <ul className="flex flex-col gap-6">
          {expos.map((expo) => (
            <li key={expo.id}>
              <Link
                href={`/exposiciones/${expo.slug}`}
                className="block p-6 md:p-8 rounded-[40px] transition-all hover:shadow-lg active:scale-[0.99]"
                style={soft.flat}
              >
                <h2 className="text-xl md:text-2xl font-semibold mb-2" style={{ color: soft.textMain }}>
                  {expo.titulo}
                </h2>
                {expo.descripcion && (
                  <p className="text-base font-light mb-3" style={{ color: soft.textBody }}>
                    {expo.descripcion}
                  </p>
                )}
                <p className="text-sm font-medium" style={{ color: soft.textBody }}>
                  {expo.piezas.length} pieza{expo.piezas.length !== 1 ? 's' : ''}
                  {expo.vigencia ? ` · ${expo.vigencia}` : ''}
                </p>
                <span className="inline-block mt-4 text-orange-500 font-semibold text-sm">
                  Entrar a la sala →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
