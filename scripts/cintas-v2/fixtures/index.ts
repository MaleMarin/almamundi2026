import { CASOS_PREVIOS } from '@/scripts/cintas-v2/fixtures/casos-previos';
import { HISTORIAS } from '@/scripts/cintas-v2/fixtures/historias';

export type { CasoTexto } from '@/lib/cintas-v2/fixtures/tipos';
export { FECHA_PIE } from '@/lib/cintas-v2/fixtures/tipos';
export { HISTORIAS } from '@/scripts/cintas-v2/fixtures/historias';

export const CASOS_TEXTO = [...HISTORIAS, ...CASOS_PREVIOS];

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}
