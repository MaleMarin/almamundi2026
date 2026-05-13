'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Download, Loader2, Share2 } from 'lucide-react';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { neu } from '@/lib/historias-neumorph';
import { IMPRONTA_EXPORT_W } from '@/lib/impronta/bauhausExport';
import { HUELLA_V2_BG } from '@/lib/huella/huellaV2';
import { useSubirHuella, type SubirHuellaFormat } from '@/hooks/useSubirHuella';

export type SubmissionSuccessWithHuellaProps = {
  format: SubirHuellaFormat;
  /** Semilla textual para el análisis en servidor (título, contexto, lugar, archivo…). */
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
  const narrativeForResonance = useMemo(() => {
    const seed = narrativeSeed.trim();
    if (seed && submissionId) return `${seed}\n—\nreferencia técnica: ${submissionId}`;
    if (seed) return seed;
    if (submissionId) return `Tu participación AlmaMundi. referencia técnica: ${submissionId}`;
    return 'historia almamundi';
  }, [narrativeSeed, submissionId]);

  const canvasId = `subir-success-resonancia-${canvasIdSuffix}`;

  const { canvasRef, loading, err, setErr, analysis, statsLine, downloadPng, shareImage } = useSubirHuella({
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
          {loading ? (
            <p className="flex items-center justify-center gap-2 text-base py-10" style={{ color: neu.textBody }}>
              <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
              Preparando tu resonancia visual…
            </p>
          ) : null}
          {!loading && statsLine ? (
            <p className="text-xs md:text-sm text-center uppercase tracking-wide font-medium" style={{ color: neu.textMain }}>
              {statsLine}
            </p>
          ) : null}
          {!loading && analysis ? (
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 text-[11px] md:text-xs" style={{ color: neu.textBody }}>
              {analysis.themes.slice(0, 4).map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-black/[0.06]">
                  {t}
                </span>
              ))}
              {analysis.emotions.slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-orange-500/12 text-orange-900">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div
            className="mx-auto overflow-hidden rounded-2xl border border-white/60 shadow-inner"
            style={{ maxWidth: IMPRONTA_EXPORT_W, backgroundColor: HUELLA_V2_BG }}
          >
            <canvas
              ref={canvasRef}
              id={canvasId}
              className="block h-auto w-full"
              style={{ maxHeight: 'min(70vh, 520px)' }}
              aria-hidden={loading}
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
            disabled={loading}
            aria-busy={loading}
            className="inline-flex justify-center items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-45"
            style={{
              background: loading ? '#9ca3af' : orangeCta,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(255,69,0,0.32)',
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
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wide disabled:opacity-45"
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
