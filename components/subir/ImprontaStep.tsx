'use client';

/**
 * @deprecated No montar en el flujo de /subir. La resonancia visual solo debe mostrarse tras el envío exitoso
 * (`SubmissionSuccessWithHuella`). Este archivo se conserva por si quedan enlaces antiguos o demos.
 */

import { Download, Share2 } from 'lucide-react';
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
  canvasId = 'subir-resonancia-export-canvas',
  onBack,
  onContinue,
}: Props) {
  const { canvasRef, err, setErr, downloadPng, shareImage } = useSubirHuella({
    format,
    narrativeText,
    canvasId,
  });

  const neoCard = {
    ...neu.cardInset,
    borderRadius: '2rem',
    boxShadow: `${neu.cardInset.boxShadow}, 0 18px 40px rgba(163,177,198,0.25)`,
  } as const;
  const orangeCta =
    'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' as const;

  return (
    <section className="space-y-8 md:space-y-10" aria-label="Vista previa (obsoleto): resonancia visual" aria-current="step">
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
          Paso obsoleto · Resonancia visual · {FORMAT_LABEL[format]}
        </h1>
      </header>

      <div style={neoCard} className="p-6 md:p-8 space-y-4">
        <p className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed" style={{ color: neu.textBody }}>
          Para cada relato generamos una resonancia visual con <strong style={{ color: neu.textMain }}>cintas de memoria</strong>, paleta contenida y fondo claro. Abajo van{' '}
          <strong style={{ color: neu.textMain }}>{SUBIR_HUELLA_FOOTER_SITE}</strong> y la fecha.
        </p>
        {err && (
          <p id="subir-resonancia-step-error" className="text-sm text-amber-800" role="alert">
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
            downloadPng('almamundi-resonancia-visual.png');
          }}
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-white"
          style={{
            background: orangeCta,
            boxShadow: '0 8px 24px rgba(255,69,0,0.35)',
          }}
        >
          <Download size={20} aria-hidden />
          Descargar resonancia
        </button>
        <button
          type="button"
          onClick={() => {
            setErr('');
            void shareImage();
          }}
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide"
          style={{ ...neu.button, color: neu.orange }}
        >
          <Share2 size={20} aria-hidden />
          Compartir
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full py-5 md:py-6 rounded-full font-bold text-white text-lg md:text-xl uppercase tracking-wide"
        style={{
          background: orangeCta,
          boxShadow: '0 10px 32px rgba(255,69,0,0.4)',
        }}
      >
        Continuar
      </button>
    </section>
  );
}
