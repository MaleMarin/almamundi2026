import { FONDO, hexRgb } from '@/lib/cintas-v2/palette';
import { ANCHO, type Banda } from '@/lib/cintas-v2/compose/layout';

export function pintarBandas(bandas: Banda[], altoCampo: number, alto: number): Buffer {
  const rgba = Buffer.alloc(ANCHO * alto * 4);
  const fondo = hexRgb(FONDO);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = fondo[0];
    rgba[i + 1] = fondo[1];
    rgba[i + 2] = fondo[2];
    rgba[i + 3] = 255;
  }
  const campo = Math.max(0, Math.min(alto, altoCampo));
  for (const banda of bandas) {
    const [r, g, b] = hexRgb(banda.hex);
    const x0 = Math.max(0, banda.x);
    const x1 = Math.min(ANCHO, banda.x + banda.ancho);
    for (let y = 0; y < campo; y++) {
      let i = (y * ANCHO + x0) * 4;
      for (let x = x0; x < x1; x++) {
        rgba[i] = r;
        rgba[i + 1] = g;
        rgba[i + 2] = b;
        rgba[i + 3] = 255;
        i += 4;
      }
    }
  }
  return rgba;
}
