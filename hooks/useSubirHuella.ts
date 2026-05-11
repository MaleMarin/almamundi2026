'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HuellaVisualParams, StoryAnalysis } from '@/lib/huella/types';
import { analysisToVisualParams } from '@/lib/huella/translate';
import {
  drawImprontaBauhaus,
  IMPRONTA_EXPORT_H,
  IMPRONTA_EXPORT_W,
} from '@/lib/impronta/bauhausExport';
import { computeTextStats, temperatureLabel } from '@/lib/impronta/textStats';
import { huellaFormatFromSubmission } from '@/lib/impronta/formatMap';

export type SubirHuellaFormat = 'video' | 'audio' | 'texto' | 'foto';

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function fallbackHuellaParams(text: string, format: SubirHuellaFormat): { analysis: StoryAnalysis; visualParams: HuellaVisualParams } {
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

const FORMAT_LABEL: Record<SubirHuellaFormat, string> = {
  video: 'Video',
  audio: 'Audio',
  texto: 'Texto',
  foto: 'Fotos',
};

export const SUBIR_HUELLA_FOOTER_SITE = 'www.almamundi.org';

type UseSubirHuellaOptions = {
  format: SubirHuellaFormat;
  narrativeText: string;
  canvasId: string;
};

/** Genera Bauhaus/impronta en canvas (`drawImprontaBauhaus`) vía `/api/impronta/analyze` o fallback local. */
export function useSubirHuella({ format, narrativeText, canvasId }: UseSubirHuellaOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [statsLine, setStatsLine] = useState('');

  const redraw = useCallback(
    (params: HuellaVisualParams) => {
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
        footerLine: SUBIR_HUELLA_FOOTER_SITE,
        dateLabel,
        formatLabel: FORMAT_LABEL[format],
      });
    },
    [format]
  );

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
          const fb = fallbackHuellaParams(text, format);
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
        const fb = fallbackHuellaParams(text, format);
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

  const downloadPng = useCallback(
    (filename = 'almamundi-mi-huella.png') => {
      const canvas = (document.getElementById(canvasId) as HTMLCanvasElement | null) ?? canvasRef.current;
      if (!canvas) return false;
      try {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = filename;
        a.click();
        return true;
      } catch {
        setErr('No se pudo descargar en este navegador.');
        return false;
      }
    },
    [canvasId]
  );

  const shareImage = useCallback(async () => {
    const canvas = (document.getElementById(canvasId) as HTMLCanvasElement | null) ?? canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) {
        setErr('No se pudo generar la imagen para compartir.');
        return;
      }
      const file = new File([blob], 'almamundi-mi-huella.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Tu huella — AlmaMundi',
          text: `Mi huella en ${SUBIR_HUELLA_FOOTER_SITE}`,
        });
        return;
      }
      await navigator.clipboard.writeText(`https://${SUBIR_HUELLA_FOOTER_SITE}`);
      setErr('');
      window.alert('Tu navegador no permite compartir el archivo aquí. Enlace copiado al portapapeles.');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setErr('No se pudo abrir el menú de compartir.');
    }
  }, [canvasId]);

  return {
    canvasRef,
    loading,
    err,
    setErr,
    analysis,
    statsLine,
    downloadPng,
    shareImage,
  };
}
