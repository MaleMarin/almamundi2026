import { CASOS_PREVIOS } from '@/lib/cintas-v2/fixtures/casos-previos';
import { HISTORIAS, type CasoTexto } from '@/lib/cintas-v2/fixtures/historias';

export type { CasoTexto };
export { FECHA_PIE, HISTORIAS } from '@/lib/cintas-v2/fixtures/historias';

export const CASOS_TEXTO: CasoTexto[] = [...HISTORIAS, ...CASOS_PREVIOS];

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}
