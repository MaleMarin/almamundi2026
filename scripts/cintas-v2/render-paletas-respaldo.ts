/**
 * Hoja de las 36 paletas de respaldo. No toca las cintas.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/render-paletas-respaldo.ts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { PALETA_MADRE, TONOS_MADRE, type TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import {
  PALETAS_RESPALDO,
  elegirPaletaRespaldo,
  type IntensidadRespaldo,
  type LuzRespaldo,
  type PaletaRespaldo,
  type RolRespaldo,
} from '@/lib/cintas-v2/compose/paletas-respaldo';
import { rngDeId } from '@/lib/cintas-v2/seed';
import { escapeXml } from '@/scripts/cintas-v2/footer';

const CALIDOS = new Set<TonoMadre>(['rojo', 'naranja', 'amarillo', 'rosa', 'magenta']);
const FRIOS = new Set<TonoMadre>(['verde azulado', 'calipso', 'azul', 'azul violeta', 'morado']);
const PESO: Record<RolRespaldo, number> = { prota: 3, sec: 2, acento: 1 };
const LUCES: LuzRespaldo[] = ['luminosa', 'media', 'profunda'];
const INTENSIDADES: IntensidadRespaldo[] = ['calma', 'media', 'intensa'];

function hexDe(tono: TonoMadre, nivel: number): string {
  return PALETA_MADRE.find((color) => color.tono === tono && color.nivel === nivel)?.hex ?? '';
}

function revisar(): string[] {
  const errores: string[] = [];
  if (PALETAS_RESPALDO.length !== 36) errores.push(`hay ${PALETAS_RESPALDO.length} paletas`);
  const nombres = new Set<string>();
  for (const luz of LUCES) {
    for (const intensidad of INTENSIDADES) {
      const grupo = PALETAS_RESPALDO.filter((paleta) => paleta.luz === luz && paleta.intensidad === intensidad);
      if (grupo.length !== 4) errores.push(`${luz}/${intensidad} tiene ${grupo.length}`);
      const protas = new Set(grupo.map((paleta) => paleta.colores.find((color) => color.rol === 'prota')?.tono));
      if (protas.size !== 4) errores.push(`${luz}/${intensidad} repite protagonista`);
    }
  }
  for (const paleta of PALETAS_RESPALDO) {
    if (nombres.has(paleta.nombre)) errores.push(`nombre repetido ${paleta.nombre}`);
    nombres.add(paleta.nombre);
    const n = paleta.colores.length;
    if (n < 5 || n > 7) errores.push(`${paleta.nombre} tiene ${n} colores`);
    const roles = { prota: 0, sec: 0, acento: 0 };
    const tonos = new Set<TonoMadre>();
    const niveles: number[] = [];
    for (const color of paleta.colores) {
      roles[color.rol] += 1;
      tonos.add(color.tono);
      niveles.push(color.nivel);
      if (!hexDe(color.tono, color.nivel)) errores.push(`${paleta.nombre} sin color de la madre`);
    }
    const protagonista = paleta.colores.find((color) => color.rol === 'prota');
    if (!protagonista || protagonista.nivel > 3) errores.push(`${paleta.nombre} tiene protagonista claro`);
    if (paleta.intensidad === 'calma' && protagonista) {
      const fuertes = paleta.colores.filter((color) => Math.abs(color.nivel - protagonista.nivel) >= 2);
      if (fuertes.length > 1 || fuertes.some((color) => color.rol !== 'acento')) {
        errores.push(`${paleta.nombre} tiene más de un acento fuerte`);
      }
    }
    if (roles.prota !== 1) errores.push(`${paleta.nombre} tiene ${roles.prota} protagonistas`);
    if (roles.sec < 2 || roles.sec > 3) errores.push(`${paleta.nombre} tiene ${roles.sec} secundarios`);
    if (roles.acento < 2 || roles.acento > 3) errores.push(`${paleta.nombre} tiene ${roles.acento} acentos`);
    if (tonos.size < 4) errores.push(`${paleta.nombre} cubre ${tonos.size} tonos`);
    if (tonos.size !== n) errores.push(`${paleta.nombre} repite un tono`);
    if (![...tonos].some((tono) => CALIDOS.has(tono)) || ![...tonos].some((tono) => FRIOS.has(tono))) {
      errores.push(`${paleta.nombre} no mezcla cálido y frío`);
    }
    const minimo = Math.min(...niveles);
    const maximo = Math.max(...niveles);
    const vivosClaros = niveles.filter((nivel) => nivel === 3 || nivel === 4).length;
    const profundos = niveles.filter((nivel) => nivel <= 2).length;
    if (paleta.luz === 'luminosa' && vivosClaros <= n / 2) errores.push(`${paleta.nombre} no es luminosa`);
    if (paleta.luz === 'luminosa' && paleta.intensidad !== 'calma' && minimo > 2) {
      errores.push(`${paleta.nombre} no es luminosa con ancla`);
    }
    if (paleta.luz === 'profunda' && profundos <= n / 2) errores.push(`${paleta.nombre} no es profunda`);
    if (paleta.luz === 'profunda' && !paleta.colores.some((color) => color.rol === 'acento' && color.nivel === 3)) {
      errores.push(`${paleta.nombre} no respira`);
    }
    if (paleta.intensidad === 'calma' && maximo - minimo > 2) errores.push(`${paleta.nombre} no está en calma`);
    if (paleta.intensidad === 'intensa' && (minimo > 1 || maximo < 4)) errores.push(`${paleta.nombre} no es intensa`);
    if (paleta.intensidad === 'media' && paleta.luz !== 'profunda' && (maximo - minimo < 2 || (minimo === 1 && maximo >= 4))) {
      errores.push(`${paleta.nombre} no queda en el medio`);
    }
    if (paleta.intensidad === 'media' && paleta.luz === 'profunda' && niveles.filter((nivel) => nivel === 3).length < 2) {
      errores.push(`${paleta.nombre} profunda media sin aire`);
    }
  }
  const palidos = PALETAS_RESPALDO.filter((paleta) =>
    paleta.colores.some((color) => color.tono === 'amarillo' && color.nivel >= 4),
  ).length;
  if (palidos > 10) errores.push(`amarillo pálido en ${palidos} paletas`);
  return errores;
}

function simular(): { usos: Map<string, number>; tonos: Map<TonoMadre, number> } {
  const rng = rngDeId('ronda10:muestra');
  const usos = new Map<string, number>();
  const tonos = new Map<TonoMadre, number>();
  for (const tono of TONOS_MADRE) tonos.set(tono, 0);
  for (let i = 0; i < 100; i++) {
    const paleta = elegirPaletaRespaldo(rng(), rng(), `muestra-10-${i}`);
    usos.set(paleta.nombre, (usos.get(paleta.nombre) ?? 0) + 1);
    for (const color of paleta.colores) tonos.set(color.tono, (tonos.get(color.tono) ?? 0) + PESO[color.rol]);
  }
  return { usos, tonos };
}

function hoja(): string {
  const margen = 36;
  const tituloAlto = 78;
  const anchoCelda = 690;
  const altoCelda = 268;
  const hueco = 18;
  const ancho = margen * 2 + 3 * anchoCelda + 2 * hueco;
  const alto = margen + tituloAlto + 3 * altoCelda + 2 * hueco + margen;
  const anchoProta = 104;
  const anchoSec = 58;
  const anchoAcento = 32;
  const separacion = 7;
  const altoBloque = 34;
  const celdas = LUCES.flatMap((luz, fila) =>
    INTENSIDADES.map((intensidad, columna) => {
      const x = margen + columna * (anchoCelda + hueco);
      const y = margen + tituloAlto + fila * (altoCelda + hueco);
      const grupo = PALETAS_RESPALDO.filter((paleta) => paleta.luz === luz && paleta.intensidad === intensidad);
      const luzNombre = luz === 'media' ? 'Luz media' : luz[0]!.toUpperCase() + luz.slice(1);
      const intensidadNombre = intensidad === 'media' ? 'intensidad media' : intensidad;
      const encabezado = `<text x="${x + 18}" y="${y + 30}" fill="#3D3A36" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(`${luzNombre} · ${intensidadNombre}`)}</text>`;
      const filas = grupo
        .map((paleta, indice) => filaDe(paleta, x + 18, y + 48 + indice * 52, anchoProta, anchoSec, anchoAcento, separacion, altoBloque))
        .join('');
      return `<rect x="${x}" y="${y}" width="${anchoCelda}" height="${altoCelda}" fill="#EFEAE2"/>${encabezado}${filas}`;
    }),
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
  <rect width="100%" height="100%" fill="#F7F4EE"/>
  <text x="${margen}" y="${margen + 28}" fill="#3D3A36" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="700">Paletas de respaldo</text>
  <text x="${margen}" y="${margen + 54}" fill="#3D3A36" font-family="Helvetica, Arial, sans-serif" font-size="16">El bloque ancho es el protagonista. Los medianos son secundarios. Los finos son acentos.</text>
  ${celdas}
</svg>`;
}

function filaDe(
  paleta: PaletaRespaldo,
  x: number,
  y: number,
  anchoProta: number,
  anchoSec: number,
  anchoAcento: number,
  separacion: number,
  altoBloque: number,
): string {
  const orden = [...paleta.colores].sort((a, b) => PESO[b.rol] - PESO[a.rol]);
  let cursor = x + 236;
  const bloques = orden
    .map((color) => {
      const ancho = color.rol === 'prota' ? anchoProta : color.rol === 'sec' ? anchoSec : anchoAcento;
      const rect = `<rect x="${cursor}" y="${y}" width="${ancho}" height="${altoBloque}" fill="${hexDe(color.tono, color.nivel)}"/>`;
      cursor += ancho + separacion;
      return rect;
    })
    .join('');
  return `<text x="${x}" y="${y + 23}" fill="#3D3A36" font-family="Helvetica, Arial, sans-serif" font-size="15">${escapeXml(paleta.nombre)}</text>${bloques}`;
}

async function main() {
  const errores = revisar();
  if (errores.length > 0) throw new Error(errores.join('; '));
  const { usos, tonos } = simular();
  const total = [...tonos.values()].reduce((suma, valor) => suma + valor, 0) || 1;
  let supera = false;
  for (const paleta of PALETAS_RESPALDO) {
    const veces = usos.get(paleta.nombre) ?? 0;
    console.log(`USO ${paleta.luz}/${paleta.intensidad} | ${paleta.nombre} | ${veces}`);
    if (veces > 6) supera = true;
  }
  for (const tono of TONOS_MADRE) {
    const parte = ((tonos.get(tono) ?? 0) / total) * 100;
    console.log(`TONO ${tono} ${parte.toFixed(1)}%`);
    if (parte > 15) supera = true;
  }
  if (supera) console.log('DIVERSIDAD SUPERA');
  const salida = resolve('tmp-cintas-v2/salida');
  await mkdir(salida, { recursive: true });
  const destino = join(salida, 'paletas-respaldo.png');
  await writeFile(destino, await sharp(Buffer.from(hoja())).png().toBuffer());
  console.log(destino);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'error');
  process.exit(1);
});
