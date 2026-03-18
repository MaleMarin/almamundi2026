'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MapPin, Image as ImageIcon } from 'lucide-react';
import { getExposicionBySlug } from '@/lib/exposiciones';
import { generatePostalPNG } from '@/lib/postal';

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

export default function ExposicionDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const exposicion = getExposicionBySlug(slug);

  const [indexPieza, setIndexPieza] = useState(0);
  const [postalOpen, setPostalOpen] = useState(false);
  const [postalAlias, setPostalAlias] = useState('');
  const [postalFecha, setPostalFecha] = useState('');
  const [postalBlob, setPostalBlob] = useState<Blob | null>(null);

  const piezas = exposicion?.piezas ?? [];
  const piezaActual = piezas[indexPieza];
  const total = piezas.length;
  const hasPrev = total > 0 && indexPieza > 0;
  const hasNext = total > 0 && indexPieza < total - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) setIndexPieza((i) => i - 1);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) setIndexPieza((i) => i + 1);
  }, [hasNext]);

  const onGenerarPostal = useCallback(async () => {
    try {
      const blob = await generatePostalPNG(postalAlias.trim(), postalFecha.trim());
      setPostalBlob(blob);
    } catch (e) {
      console.error('postal', e);
    }
  }, [postalAlias, postalFecha]);

  const onDescargarPostal = useCallback(() => {
    if (!postalBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(postalBlob);
    a.download = `postal-almamundi-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [postalBlob]);

  const onCopiarEnlace = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).catch(() => {});
  }, []);

  if (!exposicion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
        <p className="text-gray-600 mb-4">No se encontró esta exposición.</p>
        <Link href="/exposiciones" className="text-orange-500 font-semibold hover:underline">
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
          <Link href="/exposiciones" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Exposiciones
          </Link>
          <Link href="/#mapa" className="px-6 py-3 active:scale-95 hover:text-orange-600 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-4xl mx-auto">
        <Link href="/exposiciones" className="inline-block text-sm font-medium mb-6" style={{ color: soft.textBody }}>
          ← Volver al listado
        </Link>

        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: soft.textMain }}>
          {exposicion.titulo}
        </h1>
        {exposicion.descripcion && (
          <p className="text-lg font-light mb-8" style={{ color: soft.textBody }}>
            {exposicion.descripcion}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href={slug ? `/?expo=${encodeURIComponent(slug)}#mapa` : '/#mapa'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-orange-600 hover:bg-orange-500/10 transition"
            style={soft.button}
          >
            <MapPin size={18} />
            Ver en el mapa
          </Link>
          <button
            type="button"
            onClick={() => { setPostalOpen((o) => !o); setPostalBlob(null); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-orange-600 hover:bg-orange-500/10 transition"
            style={soft.button}
          >
            <ImageIcon size={18} />
            Crear postal
          </button>
        </div>

        {postalOpen && (
          <div className="mb-10 p-6 rounded-[32px]" style={soft.flat}>
            <p className="text-sm font-semibold mb-4" style={{ color: soft.textMain }}>Postal (OG image)</p>
            {!postalBlob ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: soft.textBody }}>Alias</label>
                    <input
                      type="text"
                      value={postalAlias}
                      onChange={(e) => setPostalAlias(e.target.value)}
                      placeholder="Nombre público"
                      className="w-full px-4 py-2 rounded-xl border border-white/50 bg-white/50 outline-none text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: soft.textBody }}>Fecha</label>
                    <input
                      type="text"
                      value={postalFecha}
                      onChange={(e) => setPostalFecha(e.target.value)}
                      placeholder="Ej. 2025"
                      className="w-full px-4 py-2 rounded-xl border border-white/50 bg-white/50 outline-none text-gray-700"
                    />
                  </div>
                </div>
                <button type="button" onClick={onGenerarPostal} className="px-5 py-2.5 rounded-full font-semibold text-white bg-orange-500 hover:bg-orange-600 transition text-sm">
                  Generar PNG
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onDescargarPostal} className="px-5 py-2.5 rounded-full font-semibold text-sm" style={soft.button}>
                  Descargar PNG
                </button>
                <button type="button" onClick={onCopiarEnlace} className="px-5 py-2.5 rounded-full font-semibold text-sm" style={soft.button}>
                  Copiar enlace
                </button>
                <button type="button" onClick={() => setPostalBlob(null)} className="text-sm" style={{ color: soft.textBody }}>
                  Otra postal
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modo sala: pieza actual con next/prev */}
        {total === 0 ? (
          <div className="p-8 rounded-[40px] text-center" style={soft.flat}>
            <p style={{ color: soft.textBody }}>Esta exposición no tiene piezas aún.</p>
          </div>
        ) : (
          <section className="rounded-[40px] overflow-hidden" style={soft.flat}>
            <div className="p-8 md:p-10 min-h-[280px] flex flex-col">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: soft.textBody }}>
                  Pieza {indexPieza + 1} de {total}
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold mb-4" style={{ color: soft.textMain }}>
                  {piezaActual?.titulo}
                </h2>
                {piezaActual?.descripcion && (
                  <p className="text-base font-light leading-relaxed" style={{ color: soft.textBody }}>
                    {piezaActual.descripcion}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-300/40">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!hasPrev}
                  className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/30 active:scale-95 transition"
                  style={soft.button}
                  aria-label="Pieza anterior"
                >
                  <ChevronLeft size={20} />
                  Anterior
                </button>
                <span className="text-sm font-medium" style={{ color: soft.textBody }}>
                  {indexPieza + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/30 active:scale-95 transition"
                  style={soft.button}
                  aria-label="Pieza siguiente"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
