'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import type { HuellaVisualParams, StoryAnalysis } from '@/lib/huella/types';
import { analysisToVisualParams } from '@/lib/huella/translate';
import {
  drawImprontaBauhaus,
  IMPRONTA_EXPORT_H,
  IMPRONTA_EXPORT_W,
} from '@/lib/impronta/bauhausExport';
import { computeTextStats, temperatureLabel } from '@/lib/impronta/textStats';
import { huellaFormatFromSubmission } from '@/lib/impronta/formatMap';
import { neu } from '@/lib/historias-neumorph';

export type SubirFormat = 'video' | 'audio' | 'texto' | 'foto';

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function fallbackParams(text: string, format: SubirFormat): { analysis: StoryAnalysis; visualParams: HuellaVisualParams } {
  const stats = computeTextStats(text);
  const analysis: StoryAnalysis = {
    themes: ['historia', 'voz'],
    emotions: stats.temperature > 0.55 ? ['intensidad'] : ['calma'],
    intensity: clamp01(stats.temperature * 0.9 + 0.05),
    rhythm: clamp01(stats.punctDensity * 4 + stats.uniqueRatio * 0.35),
    depth: clamp01(stats.uniqueRatio * 0.85 + (stats.wordCount > 80 ? 0.15 : 0)),
    tone: stats.temperature,
  };
  const visualParams = analysisToVisualParams(analysis, huellaFormatFromSubmission(format));
  return { analysis, visualParams };
}

const FOOTER_SITE = 'www.almamundi.org';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [statsLine, setStatsLine] = useState('');

  const redraw = useCallback((params: HuellaVisualParams) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = IMPRONTA_EXPORT_W;
    canvas.height = IMPRONTA_EXPORT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dateLabel = new Intl.DateTimeFormat('es', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date());
    drawImprontaBauhaus(ctx, params, {
      footerLine: FOOTER_SITE,
      dateLabel,
      formatLabel: FORMAT_LABEL[format],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const text = narrativeText.trim() || 'historia almamundi';

    async function run() {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch('/api/impronta/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, format }),
        });
        const data = (await res.json()) as {
          analysis?: StoryAnalysis | null;
          visualParams?: HuellaVisualParams;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.visualParams) {
          const fb = fallbackParams(text, format);
          setAnalysis(fb.analysis);
          const st = computeTextStats(text);
          setStatsLine(
            `${temperatureLabel(st.temperature)} · ${st.wordCount} palabras · heurística local (sin IA o API no disponible)`
          );
          redraw(fb.visualParams);
          if (!res.ok && data.error) setErr(data.error);
          return;
        }
        setAnalysis(data.analysis ?? null);
        const st = computeTextStats(text);
        if (data.analysis) {
          setStatsLine(
            `${temperatureLabel(st.temperature)} · Tono modelo ${(data.analysis.tone * 100).toFixed(0)}% · ${st.wordCount} palabras`
          );
        } else {
          setStatsLine(`${temperatureLabel(st.temperature)} · ${st.wordCount} palabras`);
        }
        redraw(data.visualParams);
      } catch {
        if (cancelled) return;
        const fb = fallbackParams(text, format);
        setAnalysis(fb.analysis);
        setStatsLine('Vista generada en tu dispositivo (sin conexión al análisis en servidor).');
        redraw(fb.visualParams);
        setErr('No hubo respuesta del servidor; usamos un diseño local.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [format, narrativeText, redraw]);

  const downloadPng = useCallback(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'AlmaMundi-impronta.png';
      a.click();
    } catch {
      setErr('No se pudo descargar en este navegador.');
    }
  }, [canvasId]);

  const shareImage = useCallback(async () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) {
        setErr('No se pudo generar la imagen para compartir.');
        return;
      }
      const file = new File([blob], 'AlmaMundi-impronta.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi impronta — AlmaMundi',
          text: `Mi impronta en ${FOOTER_SITE}`,
        });
        return;
      }
      await navigator.clipboard.writeText(`https://${FOOTER_SITE}`);
      setErr('');
      window.alert('Tu navegador no permite compartir el archivo aquí. Enlace copiado al portapapeles.');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setErr('No se pudo abrir el menú de compartir.');
    }
  }, [canvasId]);

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
          <strong style={{ color: neu.textMain }}>www.almamundi.org</strong> y la fecha.
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
          onClick={downloadPng}
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
          onClick={() => void shareImage()}
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
