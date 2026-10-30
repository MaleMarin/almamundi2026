import type { AlmaLocale } from '@/lib/i18n/locale';
import { QUESTION_IDS, preguntaPorId, type QuestionId } from '@/lib/pregunta-semana';

/**
 * Textos leídos de `lib/pregunta-semana.ts` (tema y pregunta «tú»).
 * Un hilo sin preguntas no entra en la lista visible.
 */
export const HILO_COLORES = [
  '#FF4A1C',
  '#D94F8C',
  '#E5A100',
  '#3B6FD4',
  '#2E9C8A',
  '#E07A2F',
  '#8E4FD6',
  '#1F4E79',
  '#4C8C3A',
  '#00A3B4',
  '#6B5B95',
  '#F25C54',
] as const;

export type NivelPregunta = 'empezar' | 'hondo' | 'chispa';

export type Hilo = {
  id: QuestionId;
  nombre: Record<AlmaLocale, string>;
  color: string;
};

export type PreguntaHilo = {
  id: string;
  hiloId: QuestionId;
  nivel: NivelPregunta;
  texto: Record<AlmaLocale, string>;
};

function armarHilos(): { hilos: Hilo[]; preguntas: PreguntaHilo[] } {
  const hilos: Hilo[] = [];
  const preguntas: PreguntaHilo[] = [];
  QUESTION_IDS.forEach((id, index) => {
    const fuente = preguntaPorId(id);
    const color = HILO_COLORES[index];
    if (!fuente || !color) return;
    preguntas.push({
      id,
      hiloId: id,
      nivel: 'empezar',
      texto: fuente.tu,
    });
    hilos.push({ id, nombre: fuente.tema, color });
  });
  const conPreguntas = new Set(preguntas.map((pregunta) => pregunta.hiloId));
  return {
    hilos: hilos.filter((hilo) => conPreguntas.has(hilo.id)),
    preguntas,
  };
}

const ARMADO = armarHilos();

export const HILOS: Hilo[] = ARMADO.hilos;

export const PREGUNTAS_HILO: PreguntaHilo[] = ARMADO.preguntas;

export function preguntaHiloPorId(id: string | null | undefined): PreguntaHilo | null {
  if (!id) return null;
  return PREGUNTAS_HILO.find((pregunta) => pregunta.id === id) ?? null;
}

export function hiloPorId(id: string | null | undefined): Hilo | null {
  if (!id) return null;
  return HILOS.find((hilo) => hilo.id === id) ?? null;
}

/** Otra pregunta, distinta de la que se está viendo. */
export function preguntaAlAzar(exceptoId: string | null): PreguntaHilo | null {
  const pool = PREGUNTAS_HILO.filter((pregunta) => pregunta.id !== exceptoId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/** Una pregunta de otro hilo. Si no hay otro hilo, otra pregunta. */
export function preguntaDeOtroHilo(
  hiloId: string | null,
  exceptoId: string | null
): PreguntaHilo | null {
  const otros = PREGUNTAS_HILO.filter(
    (pregunta) => pregunta.hiloId !== hiloId && pregunta.id !== exceptoId
  );
  const pool = otros.length > 0 ? otros : PREGUNTAS_HILO.filter((pregunta) => pregunta.id !== exceptoId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
