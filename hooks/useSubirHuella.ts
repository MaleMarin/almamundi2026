'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { IMPRONTA_EXPORT_H, IMPRONTA_EXPORT_W } from '@/lib/impronta/bauhausExport';
import { drawHuellaV2OnCanvas, type HuellaV2Meta } from '@/lib/huella/huellaV2';

export type SubirHuellaFormat = 'video' | 'audio' | 'texto' | 'foto';

const FORMAT_LABEL: Record<SubirHuellaFormat, string> = {
  video: 'Video',
  audio: 'Audio',
  texto: 'Texto',
  foto: 'Fotos',
};

export const SUBIR_HUELLA_FOOTER_SITE = 'www.almamundi.org';

function stableStoryId(submissionId: string | null | undefined, text: string, format: SubirHuellaFormat): string {
  const sid = submissionId?.trim();
  if (sid) return sid.slice(0, 120);
  let h = 2166136261;
  const s = `${format}|${text.slice(0, 2000)}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `sub-${format}-${(h >>> 0).toString(16)}`;
}

type UseSubirHuellaOptions = {
  format: SubirHuellaFormat;
  /** Texto del relato / contexto para la semilla visual (sin metadatos técnicos). */
  narrativeText: string;
  canvasId: string;
  submissionId?: string | null;
  storyTitle?: string | null;
};

/**
 * Resonancia visual (cintas de memoria / render v2) en canvas.
 * Todo el dibujo es determinista en cliente; no se muestran ni exportan tonos, %, conteos ni etiquetas de análisis.
 */
export function useSubirHuella({
  format,
  narrativeText,
  canvasId,
  submissionId,
  storyTitle,
}: UseSubirHuellaOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState('');

  const paintResonanceVisual = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = IMPRONTA_EXPORT_W;
    canvas.height = IMPRONTA_EXPORT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const raw = narrativeText.trim();
    const textForPalette = raw.length > 0 ? raw : ' ';
    const meta: HuellaV2Meta = {
      storyId: stableStoryId(submissionId, raw || `subir-${format}`, format),
      content: textForPalette,
      format,
      charCount: Math.max(1, raw.length > 0 ? raw.length : 120),
      submitHour: new Date().getHours(),
      embedSiteFooter: true,
      footerAt: new Date(),
      embedStoryTitle: storyTitle?.trim() || undefined,
      embedFormatLabel: FORMAT_LABEL[format],
    };
    drawHuellaV2OnCanvas(ctx, meta);
  }, [format, narrativeText, submissionId, storyTitle]);

  useLayoutEffect(() => {
    paintResonanceVisual();
  }, [paintResonanceVisual]);

  const downloadPng = useCallback(
    (filename = 'almamundi-resonancia-visual.png') => {
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
      const file = new File([blob], 'almamundi-resonancia-visual.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Resonancia visual — AlmaMundi',
          text: `Mi resonancia visual en ${SUBIR_HUELLA_FOOTER_SITE}`,
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
    err,
    setErr,
    downloadPng,
    shareImage,
  };
}
