import { CASOS_PREVIOS } from '@/lib/cintas-v2/fixtures/casos-previos';

export type { CasoTexto } from '@/lib/cintas-v2/fixtures/tipos';
export { FECHA_PIE } from '@/lib/cintas-v2/fixtures/tipos';

export const CASOS_TEXTO = [...CASOS_PREVIOS];

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}
