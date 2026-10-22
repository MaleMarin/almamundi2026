import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import { MODELO_TRANSCRIPCION, PRECIO_TRANSCRIPCION_POR_MINUTO, costoMinutosUsd } from '@/lib/cintas-v2/modelos';

export type Segmento = { inicio: number; fin: number; texto: string };

export type Transcripcion = {
  texto: string;
  segmentos: Segmento[];
  minutos: number;
  costoUsd: number;
};

/**
 * Una sola pasada con whisper-1. Devuelve el texto y las marcas de tiempo.
 * Los silencios de la cinta no salen de aquí: los mide ffmpeg.
 */
export async function transcribirArchivo(archivo: string, apiKey: string): Promise<Transcripcion> {
  const openai = new OpenAI({ apiKey });
  const verbose = await openai.audio.transcriptions.create({
    file: createReadStream(archivo),
    model: MODELO_TRANSCRIPCION,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });
  const segundos = verbose.duration || verbose.usage?.seconds || 0;
  const segmentos = (verbose.segments ?? [])
    .map((s) => ({ inicio: s.start, fin: s.end, texto: s.text.trim() }))
    .filter((s) => s.fin > s.inicio && s.texto.length > 0);
  const minutos = segundos / 60;
  return {
    texto: verbose.text.trim(),
    segmentos,
    minutos,
    costoUsd: costoMinutosUsd(minutos, PRECIO_TRANSCRIPCION_POR_MINUTO),
  };
}
