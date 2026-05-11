'use client';

import { Download, Loader2, Share2 } from 'lucide-react';
import { IMPRONTA_EXPORT_W } from '@/lib/impronta/bauhausExport';
import { neu } from '@/lib/historias-neumorph';
import {
  SUBIR_HUELLA_FOOTER_SITE,
  useSubirHuella,
  type SubirHuellaFormat,
} from '@/hooks/useSubirHuella';

export type SubirFormat = SubirHuellaFormat;

const FORMAT_LABEL: Record<SubirFormat, string> = {
  video: 'Video',
  audio: 'Audio',
  texto: 'Texto',
  foto: 'Fotos',
};

type Props = {
  format: SubirFormat;
  narrativeText: string;
  canvasId?: string;
  onBack: () => void;
  onContinue: () => void;
};

export function ImprontaStep({
  format,
  narrativeText,
  canvasId = 'impronta-export-canvas',
  onBack,
  onContinue,
}: Props) {
  const {
    canvasRef,
    loading,
    err,
    setErr,
    analysis,
    statsLine,
    downloadPng,
    shareImage,
  } = useSubirHuella({ format, narrativeText, canvasId });

  const neoCard = {
    ...neu.cardInset,
    borderRadius: '2rem',
    boxShadow: `${neu.cardInset.boxShadow}, 0 18px 40px rgba(163,177,198,0.25)`,
  } as const;
  const orangeCta =
    'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' as const;

  return (
    <section className="space-y-8 md:space-y-10" aria-label="Paso 3 de 4: impronta visual" aria-current="step">
      <button
        type="button"
        onClick={onBack}
        className="text-base md:text-lg font-medium px-5 py-2.5 rounded-full"
        style={{ ...neu.button, color: neu.textBody }}
      >
        ← Volver a captura
      </button>

      <header className="space-y-4">
        <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-orange-600">AlmaMundi</p>
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
          Paso 2 · Huella · {FORMAT_LABEL[format]}
        </h1>
      </header>

      <div style={neoCard} className="p-6 md:p-8 space-y-4">
        <p className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed" style={{ color: neu.textBody }}>
          Para cada persona generamos una composición con <strong style={{ color: neu.textMain }}>cuadrados y rectángulos</strong>, capas de color y trazos nítidos. No hay dos iguales: sale de tus palabras y del tono del texto. Abajo van{' '}
          <strong style={{ color: neu.textMain }}>{SUBIR_HUELLA_FOOTER_SITE}</strong> y la fecha.
        </p>
        {loading && (
          <p className="flex items-center gap-2 text-base md:text-lg" style={{ color: neu.textBody }}>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Generando tu huella…
          </p>
        )}
        {statsLine && !loading && (
          <p className="text-sm md:text-base font-semibold uppercase tracking-wide" style={{ color: neu.textMain }}>
            {statsLine}
          </p>
        )}
        {analysis && !loading && (
          <div className="flex flex-wrap gap-2 text-sm md:text-base" style={{ color: neu.textBody }}>
            {analysis.themes.slice(0, 5).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-black/5">
                {t}
              </span>
            ))}
            {analysis.emotions.slice(0, 4).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-800">
                {t}
              </span>
            ))}
          </div>
        )}
        {err && (
          <p id="impronta-step-error" className="text-sm text-amber-800" role="alert">
            {err}
          </p>
        )}
      </div>

      <div
        className="mx-auto overflow-hidden rounded-2xl border border-gray-300/80 bg-white shadow-inner"
        style={{ maxWidth: IMPRONTA_EXPORT_W }}
      >
        <canvas
          ref={canvasRef}
          id={canvasId}
          className="block h-auto w-full"
          style={{ maxHeight: '70vh' }}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => {
            setErr('');
            downloadPng('AlmaMundi-impronta.png');
          }}
          disabled={loading}
          aria-busy={loading}
          aria-disabled={loading}
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-white disabled:opacity-50"
          style={{
            background: loading ? '#9ca3af' : orangeCta,
            boxShadow: loading ? 'none' : '0 8px 24px rgba(255,69,0,0.35)',
          }}
        >
          <Download size={20} aria-hidden />
          Descargar imagen
        </button>
        <button
          type="button"
          onClick={() => {
            setErr('');
            void shareImage();
          }}
          disabled={loading}
          aria-busy={loading}
          aria-disabled={loading}
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide disabled:opacity-50"
          style={{ ...neu.button, color: neu.orange }}
        >
          <Share2 size={20} aria-hidden />
          Compartir
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={loading}
        className="w-full py-5 md:py-6 rounded-full font-bold text-white text-lg md:text-xl uppercase tracking-wide disabled:opacity-50"
        style={{
          background: loading ? '#9ca3af' : orangeCta,
          boxShadow: loading ? 'none' : '0 10px 32px rgba(255,69,0,0.4)',
        }}
      >
        Seguir — completar datos
      </button>
    </section>
  );
}
