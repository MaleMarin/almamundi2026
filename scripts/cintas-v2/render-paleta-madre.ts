/**
 * Hoja de la paleta madre. No toca las cintas.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/render-paleta-madre.ts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { PALETA_MADRE, TONOS_MADRE, type NivelPaleta, type TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { enRango, medidaHsl } from '@/lib/cintas-v2/palette';

const FILAS: Array<{ nivel: NivelPaleta; etiqueta: string }> = [
  { nivel: 1, etiqueta: 'Profundo' },
  { nivel: 2, etiqueta: 'Pleno' },
  { nivel: 3, etiqueta: 'Vivo' },
  { nivel: 4, etiqueta: 'Claro' },
  { nivel: 5, etiqueta: 'Muy claro' },
];

const CALIDOS = new Set<TonoMadre>(['rojo', 'naranja', 'amarillo', 'rosa']);

function enSuTono(tono: TonoMadre, nivel: NivelPaleta, grados: number): boolean {
  if (tono === 'rojo') return grados <= 16 || grados >= 348;
  if (tono === 'naranja') return grados >= 18 && grados <= 40;
  if (tono === 'amarillo') return nivel === 1 ? grados >= 36 && grados <= 52 : grados >= 48 && grados <= 65;
  const ventana: Partial<Record<TonoMadre, [number, number]>> = {
    lima: [90, 120],
    verde: [120, 150],
    'verde azulado': [150, 180],
    calipso: [180, 210],
    azul: [210, 240],
    'azul violeta': [240, 270],
    morado: [270, 300],
    magenta: [300, 330],
    rosa: [330, 360],
  };
  const limites = ventana[tono];
  return limites !== undefined && grados >= limites[0] && grados <= limites[1];
}

function revisar(): string[] {
  const errores: string[] = [];
  if (PALETA_MADRE.length !== 60) errores.push(`hay ${PALETA_MADRE.length} colores`);
  const nombres = new Set<string>();
  const hexes = new Set<string>();
  for (const tono of TONOS_MADRE) {
    for (const fila of FILAS) {
      const color = PALETA_MADRE.find((item) => item.tono === tono && item.nivel === fila.nivel);
      if (!color) errores.push(`falta ${tono} ${fila.nivel}`);
    }
  }
  for (const color of PALETA_MADRE) {
    if (nombres.has(color.nombre)) errores.push(`nombre repetido: ${color.nombre}`);
    nombres.add(color.nombre);
    if (hexes.has(color.hex)) errores.push(`color repetido: ${color.nombre}`);
    hexes.add(color.hex);
    const medida = medidaHsl(color.hex);
    const grados = medida.h * 360;
    if (!enSuTono(color.tono, color.nivel, grados)) errores.push(`${color.nombre} cayó fuera de su tono`);
    if (!enRango(color.hex)) errores.push(`${color.nombre} fuera de rango`);
    if (color.nivel === 5 && medida.s < 0.45) errores.push(`${color.nombre} quedó lavado`);
    if (color.nivel >= 4 && CALIDOS.has(color.tono) && medida.s < 0.7) errores.push(`${color.nombre} quedó pálido`);
  }
  return errores;
}

function escapar(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function hoja(): string {
  const margen = 32;
  const etiqueta = 132;
  const bloque = 156;
  const alto = 108;
  const hueco = 12;
  const nombreAlto = 36;
  const fila = alto + nombreAlto + 16;
  const cabeza = 34;
  const ancho = margen + etiqueta + TONOS_MADRE.length * bloque + (TONOS_MADRE.length - 1) * hueco + margen;
  const altoHoja = margen + cabeza + FILAS.length * fila + margen;
  const titulos = TONOS_MADRE.map((tono, k) => {
    const x = margen + etiqueta + k * (bloque + hueco) + bloque / 2;
    return `<text x="${x}" y="${margen + 18}" text-anchor="middle" fill="#3D3A36" font-family="Montserrat, Helvetica, sans-serif" font-size="15" font-weight="600">${escapar(tono)}</text>`;
  }).join('');
  const filas = FILAS.map((filaNivel, i) => {
    const y = margen + cabeza + i * fila;
    const marca = `<text x="${margen}" y="${y + alto / 2 + 6}" fill="#3D3A36" font-family="Montserrat, Helvetica, sans-serif" font-size="16" font-weight="600">${filaNivel.etiqueta}</text>`;
    const celdas = TONOS_MADRE.map((tono, k) => {
      const color = PALETA_MADRE.find((item) => item.tono === tono && item.nivel === filaNivel.nivel);
      if (!color) return '';
      const x = margen + etiqueta + k * (bloque + hueco);
      return `<rect x="${x}" y="${y}" width="${bloque}" height="${alto}" fill="${color.hex}"/><text x="${x + bloque / 2}" y="${y + alto + 22}" text-anchor="middle" fill="#3D3A36" font-family="Montserrat, Helvetica, sans-serif" font-size="14">${escapar(color.nombre)}</text>`;
    }).join('');
    return marca + celdas;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${altoHoja}" viewBox="0 0 ${ancho} ${altoHoja}">
  <rect width="100%" height="100%" fill="#F7F4EE"/>
  ${titulos}
  ${filas}
</svg>`;
}

async function main() {
  const errores = revisar();
  if (errores.length > 0) throw new Error(errores.join('; '));
  const salida = resolve('tmp-cintas-v2/salida');
  await mkdir(salida, { recursive: true });
  const destino = join(salida, 'paleta-madre.png');
  const png = await sharp(Buffer.from(hoja())).png().toBuffer();
  await writeFile(destino, png);
  console.log(destino);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'error');
  process.exit(1);
});
