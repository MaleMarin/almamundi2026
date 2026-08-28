'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { drawVadResonanceOnCanvas, RESONANCE_EXPORT_PX } from '@/lib/huella/resonance-stripes';

export type SubirHuellaFormat = 'video' | 'audio' | 'texto' | 'foto';

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
  city?: string | null;
  country?: string | null;
  /** Fecha del pie (por defecto: ahora). En `/mi-eco` se pasa la del envío para no cambiar el texto. */
  footerAt?: Date | null;
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
  city,
  country,
  footerAt,
}: UseSubirHuellaOptions) {
  const { locale } = useHomeLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState('');

  const paintResonanceVisual = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = RESONANCE_EXPORT_PX;
    canvas.height = RESONANCE_EXPORT_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const raw = narrativeText.trim();
    const textForPalette = raw.length > 0 ? raw : ' ';
    const at = footerAt instanceof Date && !Number.isNaN(footerAt.getTime()) ? footerAt : new Date();
    drawVadResonanceOnCanvas(ctx, {
      storyId: stableStoryId(submissionId, raw || `subir-${format}`, format),
      text: textForPalette,
      locale,
      footer: {
        at,
        title: storyTitle?.trim() || undefined,
        city: city?.trim() || undefined,
        country: country?.trim() || undefined,
        locale,
      },
    });
  }, [format, narrativeText, submissionId, locale, storyTitle, city, country, footerAt]);

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
