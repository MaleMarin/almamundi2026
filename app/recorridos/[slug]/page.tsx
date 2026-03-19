'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Route } from 'lucide-react';
import { getRecorridoBySlug } from '@/lib/recorridos';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu } from '@/lib/historias-neumorph';

export default function RecorridoDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const recorrido = getRecorridoBySlug(slug);

  if (!recorrido) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
        <p className="mb-4" style={{ color: neu.textBody }}>No se encontró este recorrido.</p>
        <Link href="/recorridos" className="text-orange-500 font-semibold hover:underline">
          Volver al listado
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 md:py-6 min-h-[4.25rem] md:min-h-[4.75rem] border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: neu.textMain }}>AlmaMundi</Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/recorridos" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>← Recorridos</Link>
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ color: neu.textMain }}>
          {recorrido.title}
        </h1>
        <p className="text-lg font-light mb-8" style={{ color: neu.textBody }}>
          {recorrido.intro}
        </p>

        <ol className="list-decimal list-inside space-y-4 mb-10" style={{ color: neu.textMain }}>
          {recorrido.items.map((item, i) => (
            <li key={item.id} className="py-2 px-4 rounded-2xl" style={neu.card}>
              <span className="font-medium">{item.title}</span>
              <span className="text-sm font-light ml-2" style={{ color: neu.textBody }}>
                ({item.type})
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className="btn-almamundi inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full active:scale-95"
            style={neu.button}
          >
            <Route className="w-4 h-4" />
            Modo recorrido
          </button>
          <Link
            href="/#mapa"
            className="btn-almamundi inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full active:scale-95"
            style={neu.button}
          >
            <MapPin className="w-4 h-4" />
            Ver en el mapa
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
        <Footer />
      </div>
    </main>
  );
}
