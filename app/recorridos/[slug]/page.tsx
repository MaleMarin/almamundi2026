'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Route } from 'lucide-react';
import { getRecorridoBySlug } from '@/lib/recorridos';

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

export default function RecorridoDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const recorrido = getRecorridoBySlug(slug);

  if (!recorrido) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
        <p className="mb-4" style={{ color: soft.textBody }}>No se encontró este recorrido.</p>
        <Link href="/recorridos" className="text-orange-500 font-semibold hover:underline">
          Volver al listado
        </Link>
      </main>
    );
  }

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
          <Link href="/mapa" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ color: soft.textMain }}>
          {recorrido.title}
        </h1>
        <p className="text-lg font-light mb-8" style={{ color: soft.textBody }}>
          {recorrido.intro}
        </p>

        <ol className="list-decimal list-inside space-y-4 mb-10" style={{ color: soft.textMain }}>
          {recorrido.items.map((item, i) => (
            <li key={item.id} className="py-2 px-4 rounded-2xl" style={soft.flat}>
              <span className="font-medium">{item.title}</span>
              <span className="text-sm font-light ml-2" style={{ color: soft.textBody }}>
                ({item.type})
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full hover:text-orange-600 active:scale-95"
            style={soft.button}
          >
            <Route className="w-4 h-4" />
            Modo recorrido
          </button>
          <Link
            href="/mapa"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full hover:text-orange-600 active:scale-95"
            style={soft.button}
          >
            <MapPin className="w-4 h-4" />
            Ver en el mapa
          </Link>
        </div>
      </div>
    </main>
  );
}
