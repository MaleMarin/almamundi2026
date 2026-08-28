'use client';

import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useSubirHuella, type SubirHuellaFormat } from '@/hooks/useSubirHuella';
import { IMPRONTA_EXPORT_W } from '@/lib/impronta/bauhausExport';
import { HUELLA_V2_BG } from '@/lib/huella/huellaV2';
import { historiasInterior, neu } from '@/lib/historias-neumorph';

export type MiEcoClientProps = {
  title: string;
  narrativeText: string;
  submissionId: string;
  format: SubirHuellaFormat;
  city: string;
  country: string;
  footerAtIso: string;
  resonanceCount: number;
};

function resonanceCopy(n: number): string {
  if (n <= 0) return 'Todavía nadie ha dejado un mensaje de resonancia.';
  if (n === 1) return '1 persona resonó con tu historia.';
  return `${n} personas resonaron con tu historia.`;
}

export function MiEcoClient({
  title,
  narrativeText,
  submissionId,
  format,
  city,
  country,
  footerAtIso,
  resonanceCount,
}: MiEcoClientProps) {
  const canvasId = 'mi-eco-resonancia';
  const footerAt = useMemo(() => {
    const d = new Date(footerAtIso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [footerAtIso]);
  const { canvasRef, err, setErr, downloadPng } = useSubirHuella({
    format,
    narrativeText,
    canvasId,
    submissionId,
    storyTitle: title,
    city: city || null,
    country: country || null,
    footerAt,
  });

  const orangeCta = 'linear-gradient(180deg, #FF4A1C 0%, #D13D17 100%)' as const;

  return (
    <main
      className={`${historiasInterior.mainClassName} ${historiasInterior.fixedHeaderContentPadClassName}`}
      style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
    >
      <div className={`${historiasInterior.contentWrapClassName} px-6 md:px-12 pb-16`}>
        <header className={historiasInterior.headerClassName}>
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
            style={{ color: 'var(--almamundi-orange)' }}
          >
            Tu eco
          </p>
          <h1
            className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]"
            style={{ color: neu.textMain }}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base md:text-lg" style={{ color: neu.textBody }}>
            Un rincón solo para ti: cuántas personas resonaron con tu historia, y tu cinta de colores
            para volver a descargarla.
          </p>
        </header>

        <section className="mx-auto w-full max-w-2xl space-y-6">
          <div className="rounded-[1.5rem] p-6 md:p-8" style={neu.card}>
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              Resonancia
            </h2>
            <p className="mt-3 text-lg md:text-xl font-medium" style={{ color: neu.textMain }}>
              {resonanceCopy(resonanceCount)}
            </p>
            <p className="mt-2 text-sm" style={{ color: neu.textBody }}>
              El contenido de esos mensajes queda en el buzón; aquí solo ves el número.
            </p>
          </div>

          <div className="rounded-[1.5rem] p-6 md:p-8 space-y-4" style={neu.card}>
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              Tu cinta de arte
            </h2>
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
              <p className="text-sm text-center text-amber-800" role="alert">
                {err}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setErr('');
                downloadPng('almamundi-resonancia-visual.png');
              }}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white"
              style={{ background: orangeCta, boxShadow: '0 8px 24px rgba(255,74,28,0.32)' }}
            >
              <Download size={18} aria-hidden />
              Descargar cinta
            </button>
          </div>

          <div className="flex justify-center pb-8">
            <HomeHardLink
              href="/"
              className="inline-flex justify-center items-center rounded-full px-6 py-3.5 text-sm font-semibold"
              style={{ ...neu.button, color: neu.textMain }}
            >
              Ir al inicio
            </HomeHardLink>
          </div>
        </section>
      </div>
    </main>
  );
}
