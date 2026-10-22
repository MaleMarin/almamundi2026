/**
 * Precios de la página pública de OpenAI, octubre 2026.
 * Comprensión: gpt-6.1-sol, 2 USD / 1M entrada y 10 USD / 1M salida.
 * No acepta temperatura 0. La llamada usa razonamiento medio, una sola vez.
 * Visión: gpt-4.1-mini, 0,40 USD / 1M entrada y 1,60 USD / 1M salida.
 * Transcripción: whisper-1, 0,006 USD por minuto, con marcas de tiempo.
 */

export const MODELO_LENGUAJE = 'gpt-6.1-sol';
export const MODELO_VISION = 'gpt-4.1-mini';
export const MODELO_TRANSCRIPCION = 'whisper-1';

export const PRECIOS_LENGUAJE: Record<string, { entrada: number; salida: number }> = {
  'gpt-4.1-mini': { entrada: 0.4, salida: 1.6 },
  'gpt-6.1-sol': { entrada: 2, salida: 10 },
};

export const PRECIO_ENTRADA_POR_MILLON = PRECIOS_LENGUAJE[MODELO_LENGUAJE]!.entrada;
export const PRECIO_SALIDA_POR_MILLON = PRECIOS_LENGUAJE[MODELO_LENGUAJE]!.salida;
export const PRECIO_TRANSCRIPCION_POR_MINUTO = 0.006;

export function costoLenguajeUsd(entrada: number, salida: number, modelo = MODELO_LENGUAJE): number {
  const precio = PRECIOS_LENGUAJE[modelo] ?? PRECIOS_LENGUAJE[MODELO_LENGUAJE]!;
  return (entrada * precio.entrada + salida * precio.salida) / 1_000_000;
}

export function costoMinutosUsd(minutos: number, porMinuto: number): number {
  return minutos * porMinuto;
}
