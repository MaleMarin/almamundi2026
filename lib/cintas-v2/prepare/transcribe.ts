import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import {
  MODELO_SEGMENTOS,
  MODELO_TRANSCRIPCION,
  PRECIO_SEGMENTOS_POR_MINUTO,
  PRECIO_TRANSCRIPCION_POR_MINUTO,
  costoMinutosUsd,
} from '@/lib/cintas-v2/modelos';
import type { SilencioVoz } from '@/lib/cintas-v2/compose/layout';

export type Segmento = { inicio: number; fin: number; texto: string };

export type Transcripcion = {
  texto: string;
  segmentos: Segmento[];
  silencios: Array<{ inicio: number; fin: number; segundos: number }>;
  minutos: number;
  costoUsd: number;
  detalleSegmentos: string | null;
};

function silenciosDe(segmentos: Segmento[]): Array<{ inicio: number; fin: number; segundos: number }> {
  const orden = [...segmentos].sort((a, b) => a.inicio - b.inicio);
  const out: Array<{ inicio: number; fin: number; segundos: number }> = [];
  for (let i = 0; i < orden.length - 1; i++) {
    const actual = orden[i]!;
    const siguiente = orden[i + 1]!;
    const hueco = siguiente.inicio - actual.fin;
    if (hueco > 1) {
      out.push({ inicio: actual.fin, fin: siguiente.inicio, segundos: hueco });
    }
  }
  return out;
}

/** Reparte los silencios entre los momentos, en orden. */
export function silenciosPorMomento(
  silencios: Array<{ inicio: number; segundos: number }>,
  duracion: number,
  momentos: number
): SilencioVoz[] {
  if (momentos <= 0 || duracion <= 0) return [];
  return silencios.map((s) => {
    const frac = Math.max(0, Math.min(0.999, s.inicio / duracion));
    return { momento: Math.min(momentos - 1, Math.floor(frac * momentos)), segundos: s.segundos };
  });
}

/**
 * El texto sale de gpt-transcribe. Las marcas de tiempo salen de whisper-1,
 * porque el modelo vigente no devuelve segmentos.
 */
export async function transcribirArchivo(archivo: string, apiKey: string): Promise<Transcripcion> {
  const openai = new OpenAI({ apiKey });
  const principal = await openai.audio.transcriptions.create({
    file: createReadStream(archivo),
    model: MODELO_TRANSCRIPCION,
    response_format: 'json',
  });
  const segundosPrincipal =
    principal.usage && 'seconds' in principal.usage ? principal.usage.seconds : 0;

  let segmentos: Segmento[] = [];
  let detalleSegmentos: string | null = null;
  let segundosSegmentos = segundosPrincipal;
  try {
    const verbose = await openai.audio.transcriptions.create({
      file: createReadStream(archivo),
      model: MODELO_SEGMENTOS,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });
    segundosSegmentos = verbose.duration || verbose.usage?.seconds || segundosPrincipal;
    segmentos = (verbose.segments ?? [])
      .map((s) => ({ inicio: s.start, fin: s.end, texto: s.text.trim() }))
      .filter((s) => s.fin > s.inicio);
  } catch (error) {
    detalleSegmentos = error instanceof Error ? error.message.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***') : 'sin segmentos';
  }

  const minutos = Math.max(segundosPrincipal, segundosSegmentos) / 60;
  const costoUsd =
    costoMinutosUsd(minutos, PRECIO_TRANSCRIPCION_POR_MINUTO) +
    costoMinutosUsd(detalleSegmentos ? 0 : minutos, PRECIO_SEGMENTOS_POR_MINUTO);

  return {
    texto: principal.text.trim(),
    segmentos,
    silencios: silenciosDe(segmentos),
    minutos,
    costoUsd,
    detalleSegmentos,
  };
}
