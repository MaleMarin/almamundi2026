'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Download, Share2 } from 'lucide-react';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { neu } from '@/lib/historias-neumorph';
import { IMPRONTA_EXPORT_W } from '@/lib/impronta/bauhausExport';
import { HUELLA_V2_BG } from '@/lib/huella/huellaV2';
import { useSubirHuella, type SubirHuellaFormat } from '@/hooks/useSubirHuella';

export type SubmissionSuccessWithHuellaProps = {
  format: SubirHuellaFormat;
  /** Texto del relato / contexto para la semilla visual (sin metadatos técnicos). */
  narrativeSeed: string;
  /** Refuerza unicidad opcional si el backend devolvió id. */
  submissionId?: string | null;
  /** Título de la historia para el pie del lienzo descargable. */
  storyTitle?: string | null;
  hrefSubirAnother: string;
  canvasIdSuffix?: string;
};

/**
 * Pantalla de cierre tras envío: confirmación + resonancia visual (cintas de memoria).
 * No monta segundo header/logo: va bajo `GlobalSiteChrome` + breadcrumbs del layout raíz.
 */
export function SubmissionSuccessWithHuella({
  format,
  narrativeSeed,
  submissionId,
  storyTitle,
  hrefSubirAnother,
  canvasIdSuffix = 'success',
}: SubmissionSuccessWithHuellaProps) {
  /** Solo texto del relato / contexto editorial: nada de IDs ni metadatos técnicos en la semilla visual. */
  const narrativeForResonance = useMemo(() => narrativeSeed.trim(), [narrativeSeed]);

  const canvasId = `subir-success-resonancia-${canvasIdSuffix}`;

  const { canvasRef, err, setErr, downloadPng, shareImage } = useSubirHuella({
    format,
    narrativeText: narrativeForResonance,
    canvasId,
    submissionId,
    storyTitle,
  });

  const neoInset = {
    ...neu.cardInset,
    borderRadius: '1.5rem',
  } as React.CSSProperties;

  const orangeCta = 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' as const;

  return (
    <section className="w-full max-w-2xl mx-auto px-0 sm:px-1 pb-8" aria-labelledby="subir-success-title">
      <div
        className="p-6 md:p-10 space-y-6 md:space-y-8 rounded-[2rem]"
        style={{
          ...neu.card,
          boxShadow:
            '14px 14px 28px rgba(163,177,198,0.65), -14px -14px 28px rgba(255,255,255,0.7), 0 22px 48px rgba(163,177,198,0.35)',
          border: neu.card.border,
        }}
      >
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">AlmaMundi</p>
          <h1 id="subir-success-title" className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight" style={{ color: neu.textMain }}>
            Tu historia fue recibida
          </h1>
          <p className="text-base md:text-lg font-light leading-relaxed" style={{ color: neu.textBody }}>
            Gracias por compartirla. Quedará en revisión antes de formar parte de AlmaMundi.
          </p>
        </header>

        <div style={neoInset} className="p-5 md:p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-600">Tu resonancia visual está lista</h2>
          <p className="text-sm md:text-[0.9375rem] leading-relaxed" style={{ color: neu.textBody }}>
            Es una pieza creada a partir de tu relato, el formato elegido y el momento en que lo compartiste.
          </p>
          <p className="text-xs md:text-sm leading-relaxed opacity-95" style={{ color: neu.textBody }}>
            No resume tu vida ni interpreta quién eres: acompaña la forma en que tu historia resonó en AlmaMundi.
          </p>
        </div>

        <div style={neoInset} className="p-4 md:p-5 space-y-3">
          <div
            className="mx-auto overflow-hidden rounded-2xl border border-white/60 shadow-inner"
            style={{ maxWidth: IMPRONTA_EXPORT_W, backgroundColor: HUELLA_V2_BG }}
          >
            <canvas
              ref={canvasRef}
              id={canvasId}
              className="block h-auto w-full"
              style={{ maxHeight: 'min(70vh, 520px)' }}
            />
          </div>

          {err ? (
            <p className="text-xs md:text-sm text-amber-800 text-center px-2" role="alert">
              {err}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-stretch">
          <button
            type="button"
            onClick={() => {
              setErr('');
              downloadPng('almamundi-resonancia-visual.png');
            }}
            className="inline-flex justify-center items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white"
            style={{
              background: orangeCta,
              boxShadow: '0 8px 24px rgba(255,69,0,0.32)',
            }}
          >
            <Download size={18} aria-hidden />
            Descargar resonancia
          </button>
          <button
            type="button"
            onClick={() => {
              setErr('');
              void shareImage();
            }}
            className="inline-flex justify-center items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wide"
            style={{ ...neu.button, color: neu.orange }}
          >
            <Share2 size={18} aria-hidden />
            Compartir
          </button>
          <Link
            href={hrefSubirAnother}
            className="inline-flex justify-center items-center rounded-full px-6 py-3.5 text-sm font-semibold transition hover:opacity-95"
            style={{ ...neu.button, color: neu.textMain }}
          >
            Subir otra historia
          </Link>
          <HomeHardLink
            href="/"
            className="inline-flex justify-center items-center rounded-full px-6 py-3.5 text-sm font-semibold transition hover:opacity-95"
            style={{ ...neu.button, color: neu.textMain }}
          >
            Ir al inicio
          </HomeHardLink>
        </div>
      </div>
    </section>
  );
}
