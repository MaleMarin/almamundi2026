/**
 * Recompone las cintas desde los JSON guardados. No llama al modelo.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda3.ts
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { CASOS_TEXTO, FECHA_PIE } from '@/scripts/cintas-v2/fixtures';
import { componerCintas, type SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import { AnalisisSchema, type Analisis } from '@/lib/cintas-v2/understand/schema';
import type { OrigenAnalisis } from '@/lib/cintas-v2/understand/analyze';
import { pngV2, type Pie } from '@/scripts/cintas-v2/raster';
import { hojaPorCaso, hojaTodas, resumenAnalisis } from '@/scripts/cintas-v2/hoja';

const SALIDA = resolve('tmp-cintas-v2/salida');
const RONDA1 = join(SALIDA, 'ronda-1');
const CACHE = resolve('tmp-cintas-v2/analisis');

type Guardado = {
  analisis: Analisis;
  origen: OrigenAnalisis;
  detalle: string | null;
};

function analisisDe(json: Record<string, unknown>): Guardado {
  const crudo = json.analisis;
  const anidado =
    crudo && typeof crudo === 'object' && 'analisis' in crudo
      ? (crudo as { analisis: unknown; origen?: OrigenAnalisis; detalle?: string | null })
      : null;
  const analisis = AnalisisSchema.parse(anidado ? anidado.analisis : crudo);
  return {
    analisis,
    origen: anidado?.origen ?? (json.origen as OrigenAnalisis) ?? 'modelo',
    detalle: anidado?.detalle ?? (typeof json.detalle === 'string' ? json.detalle : null),
  };
}

async function leer(ruta: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(ruta, 'utf8')) as Record<string, unknown>;
}

async function main() {
  const piezas: Array<{ titulo: string; modo: string; png: Buffer }> = [];

  for (const caso of CASOS_TEXTO) {
    const json = await leer(join(CACHE, `${caso.id}.json`));
    const guardado = analisisDe(json);
    const plan = componerCintas({
      id: caso.id,
      analisis: guardado.analisis,
      texto: caso.texto,
      locale: caso.locale,
    });
    const pie: Pie = { titulo: caso.titulo, ciudad: caso.ciudad, pais: caso.pais, at: FECHA_PIE, locale: caso.locale };
    const v2 = await pngV2(plan.bandas, pie);
    const actual = await readFile(join(SALIDA, 'piezas', `${caso.id}-actual.png`));
    const anterior = await readFile(join(RONDA1, `${caso.id}.png`));
    const resumen = resumenAnalisis(guardado.analisis, plan.modo, guardado.origen, guardado.detalle);
    const hoja = await hojaPorCaso({ titulo: caso.titulo, actual, v2, anterior, resumen });
    await writeFile(join(SALIDA, 'piezas', `${caso.id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'por-caso', `${caso.id}.png`), hoja);
    piezas.push({ titulo: caso.titulo, modo: plan.modo, png: v2 });
    console.log(`${caso.id}: ${plan.modo}`);
  }

  const medios: Array<{ id: string; titulo: string; texto: string; colores: string[]; silencios: SilencioMarca[]; duracion: number }> = [];
  for (const id of ['audio', 'video'] as const) {
    const json = await leer(join(CACHE, `${id}.json`));
    const transcripcion = json.transcripcion as { texto?: string } | undefined;
    medios.push({
      id,
      titulo: id === 'audio' ? 'Audio de prueba' : 'Video de prueba',
      texto: transcripcion?.texto ?? '',
      colores: [],
      silencios: (json.silencios as SilencioMarca[]) ?? [],
      duracion: Number(json.duracion ?? 0),
    });
  }
  for (const id of ['foto-1', 'foto-2']) {
    const json = await leer(join(CACHE, `${id}.json`));
    const vision = json.vision as { escena?: string; atmosfera?: string } | undefined;
    const publicado = await leer(join(SALIDA, 'media', `${id}.json`)).catch((): Record<string, unknown> => ({}));
    medios.push({
      id,
      titulo: id === 'foto-1' ? 'Foto de prueba 1' : 'Foto de prueba 2',
      texto: `${vision?.escena ?? ''} ${vision?.atmosfera ?? ''}`.trim(),
      colores: Array.isArray(publicado.colores) ? (publicado.colores as string[]) : [],
      silencios: [],
      duracion: 0,
    });
  }

  for (const medio of medios) {
    const json = await leer(join(CACHE, `${medio.id}.json`));
    const guardado = analisisDe(json);
    const plan = componerCintas({
      id: medio.id,
      analisis: guardado.analisis,
      texto: medio.texto,
      locale: 'es',
      silencios: medio.silencios,
      duracionSegundos: medio.duracion,
      coloresImagen: medio.colores,
    });
    const pie: Pie = { titulo: medio.titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' };
    const v2 = await pngV2(plan.bandas, pie);
    const actual = await readFile(join(SALIDA, 'media', `${medio.id}-actual.png`));
    const anterior = await readFile(join(RONDA1, `${medio.id}.png`));
    const resumen = resumenAnalisis(guardado.analisis, plan.modo, guardado.origen, guardado.detalle);
    const hoja = await hojaPorCaso({ titulo: medio.titulo, actual, v2, anterior, resumen });
    await writeFile(join(SALIDA, 'media', `${medio.id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'media', `${medio.id}-hoja.png`), hoja);
    piezas.push({ titulo: medio.titulo, modo: plan.modo, png: v2 });
    console.log(`${medio.id}: ${plan.modo}`);
  }

  const general = await hojaTodas(piezas, 'Cintas v2, ronda 3');
  const destino = join(SALIDA, 'hoja-general-ronda-3.png');
  await writeFile(destino, general);
  console.log(`Hoja ${destino}`);
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(mensaje);
  process.exit(1);
});
