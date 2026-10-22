/**
 * Ronda 6d. Recompone desde los JSON guardados. No llama al modelo.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda6d.ts
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { CASOS_TEXTO, FECHA_PIE } from '@/scripts/cintas-v2/fixtures';
import { componerCintas, type PlanCintas, type SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import { armonizar, enRango, esCalipso, medidaHsl, rgbHex } from '@/lib/cintas-v2/palette';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { leerImagen } from '@/lib/cintas-v2/prepare/vision';
import type { OrigenAnalisis } from '@/lib/cintas-v2/understand/analyze';
import { AnalisisSchema, type Analisis } from '@/lib/cintas-v2/understand/schema';
import type { Emocion } from '@/lib/cintas-v2/palette';
import { pngV2, type Pie } from '@/scripts/cintas-v2/raster';
import { hojaPorCaso, hojaTodas, resumenAnalisis } from '@/scripts/cintas-v2/hoja';
import { LADO, metricasPie } from '@/scripts/cintas-v2/footer';

const SALIDA = resolve('tmp-cintas-v2/salida');
const RONDA1 = join(SALIDA, 'ronda-1');
const CACHE = resolve('tmp-cintas-v2/analisis');
const ENTRADA = resolve('tmp-cintas-v2/entrada');
const FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']);

type Guardado = { analisis: Analisis; origen: OrigenAnalisis; detalle: string | null };

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

function conPesoVisual(analisis: Analisis, emociones: Array<{ emocion: Emocion; peso: number }>): Analisis {
  const pesos = new Map<Emocion, number>();
  for (const emocion of analisis.emociones) pesos.set(emocion.emocion, emocion.peso * 0.3);
  for (const emocion of emociones) pesos.set(emocion.emocion, (pesos.get(emocion.emocion) ?? 0) + emocion.peso * 0.7);
  const mezcla = [...pesos.entries()]
    .map(([emocion, peso]) => ({ emocion, peso: Math.max(0, Math.min(1, Number(peso.toFixed(2)))) }))
    .filter((e) => e.peso >= 0.08)
    .sort((a, b) => b.peso - a.peso);
  if (mezcla.length === 0) return analisis;
  return { ...analisis, emociones: mezcla };
}

function tonosSilencio(plan: PlanCintas): number {
  return new Set(plan.bandas.filter((b) => b.clase === 'pausa').map((b) => b.hex)).size;
}

function pctCalipso(plan: PlanCintas): string {
  const px = plan.bandas.filter((b) => esCalipso(b.hex)).reduce((s, b) => s + b.ancho, 0);
  return `${((px / plan.ancho) * 100).toFixed(1)}%`;
}

function reporte(plan: PlanCintas): string {
  const ancho = new Map<string, number>();
  for (const banda of plan.bandas) {
    const clave = banda.clase === 'pausa' ? 'silencio' : (banda.familia ?? 'sin-familia');
    ancho.set(clave, (ancho.get(clave) ?? 0) + banda.ancho);
  }
  const pleno = plan.bandas.filter((b) => b.pleno).reduce((s, b) => s + b.ancho, 0);
  const partes = [...ancho.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`);
  return `${plan.modo} | pleno ${pleno} | ${partes.join(', ')}`;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

async function revisarPixeles(png: Buffer, titulo: string): Promise<void> {
  const altoPie = metricasPie(LADO, true).height;
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alto = Math.max(0, info.height - altoPie);
  const canales = info.channels;
  const vistos = new Map<string, { l: number; s: number }>();
  let mal = 0;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * canales;
      const hex = rgbHex(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
      if (!vistos.has(hex)) vistos.set(hex, medidaHsl(hex));
      if (!enRango(hex)) mal += 1;
    }
  }
  let claro = '';
  let oscuro = '';
  let lMax = -1;
  let lMin = 2;
  for (const [hex, medida] of vistos) {
    if (medida.l > lMax) {
      lMax = medida.l;
      claro = hex;
    }
    if (medida.l < lMin) {
      lMin = medida.l;
      oscuro = hex;
    }
  }
  const sClaro = vistos.get(claro)?.s ?? 0;
  const sOscuro = vistos.get(oscuro)?.s ?? 0;
  console.log(
    `${titulo} | píxeles ${mal === 0 ? 'dentro del límite' : `${mal} fuera`} | más claro ${claro} L${pct(lMax)} S${pct(sClaro)} | más oscuro ${oscuro} L${pct(lMin)} S${pct(sOscuro)}`
  );
  if (mal > 0) throw new Error(`${titulo} tiene píxeles fuera de rango.`);
}

async function main() {
  const piezas: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  for (const caso of CASOS_TEXTO) {
    const guardado = analisisDe(await leer(join(CACHE, `${caso.id}.json`)));
    const plan = componerCintas({ id: caso.id, analisis: guardado.analisis, texto: caso.texto, locale: caso.locale });
    const pie: Pie = { titulo: caso.titulo, ciudad: caso.ciudad, pais: caso.pais, at: FECHA_PIE, locale: caso.locale };
    const v2 = await pngV2(plan.bandas, pie);
    const actual = await readFile(join(SALIDA, 'piezas', `${caso.id}-actual.png`));
    const anterior = await readFile(join(RONDA1, `${caso.id}.png`));
    const hoja = await hojaPorCaso({
      titulo: caso.titulo,
      actual,
      v2,
      anterior,
      resumen: resumenAnalisis(guardado.analisis, plan.modo, guardado.origen, guardado.detalle),
    });
    await writeFile(join(SALIDA, 'piezas', `${caso.id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'por-caso', `${caso.id}.png`), hoja);
    await revisarPixeles(v2, caso.titulo);
    piezas.push({ titulo: caso.titulo, modo: plan.modo, png: v2 });
    console.log(`${caso.id}: calipso ${pctCalipso(plan)} | ${tonosSilencio(plan)} tonos de silencio | ${reporte(plan)}`);
  }

  const nombres = (await readdir(ENTRADA)).filter((n) => !n.startsWith('.')).sort();
  const rutas = new Map<string, string>();
  let nFoto = 0;
  for (const nombre of nombres) {
    if (!FOTO.has(extname(nombre).toLowerCase())) continue;
    nFoto += 1;
    rutas.set(`foto-${nFoto}`, join(ENTRADA, nombre));
  }

  const medios: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  for (const id of ['audio', 'video'] as const) {
    const json = await leer(join(CACHE, `${id}.json`));
    const guardado = analisisDe(json);
    const transcripcion = json.transcripcion as { texto?: string } | undefined;
    const plan = componerCintas({
      id,
      analisis: guardado.analisis,
      texto: transcripcion?.texto ?? id,
      locale: 'es',
      silencios: (json.silencios as SilencioMarca[]) ?? [],
      duracionSegundos: Number(json.duracion ?? 0),
    });
    const titulo = id === 'audio' ? 'Audio de prueba' : 'Video de prueba';
    const pie: Pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' };
    const v2 = await pngV2(plan.bandas, pie);
    const actual = await readFile(join(SALIDA, 'media', `${id}-actual.png`));
    const anterior = await readFile(join(RONDA1, `${id}.png`));
    const hoja = await hojaPorCaso({
      titulo,
      actual,
      v2,
      anterior,
      resumen: resumenAnalisis(guardado.analisis, plan.modo, guardado.origen, guardado.detalle),
    });
    await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
    await revisarPixeles(v2, titulo);
    medios.push({ titulo, modo: plan.modo, png: v2 });
    console.log(`${id}: calipso ${pctCalipso(plan)} | ${tonosSilencio(plan)} tonos de silencio | ${reporte(plan)}`);
  }

  for (const id of ['foto-1', 'foto-2']) {
    const json = await leer(join(CACHE, `${id}.json`));
    const guardado = analisisDe(json);
    const vision = json.vision as { escena?: string; atmosfera?: string; emociones?: Array<{ emocion: Emocion; peso: number }> };
    const analisis = conPesoVisual(guardado.analisis, vision?.emociones ?? []);
    const ruta = rutas.get(id);
    if (!ruta) throw new Error(`Falta la imagen de ${id}.`);
    const colores = await coloresDominantes(await leerImagen(ruta), 5);
    const plan = componerCintas({
      id,
      analisis,
      texto: `${vision?.escena ?? ''} ${vision?.atmosfera ?? ''}`.trim(),
      locale: 'es',
      coloresImagen: colores,
    });
    const titulo = id === 'foto-1' ? 'Foto de prueba 1' : 'Foto de prueba 2';
    const pie: Pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' };
    const v2 = await pngV2(plan.bandas, pie);
    const actual = await readFile(join(SALIDA, 'media', `${id}-actual.png`));
    const anterior = await readFile(join(RONDA1, `${id}.png`));
    const hoja = await hojaPorCaso({
      titulo,
      actual,
      v2,
      anterior,
      resumen: resumenAnalisis(analisis, plan.modo, guardado.origen, guardado.detalle),
    });
    await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
    await revisarPixeles(v2, titulo);
    medios.push({ titulo, modo: plan.modo, png: v2 });
    const enCinta = [...new Set(plan.bandas.filter((b) => b.motivo === 'color-imagen').map((b) => b.hex))];
    console.log(`${id} reales ${colores.join(' ')}`);
    console.log(`${id} mezcla ${colores.map((hex) => armonizar(hex)).join(' ')}`);
    console.log(`${id} en cinta ${enCinta.join(' ') || 'ninguno'}`);
    console.log(`${id}: calipso ${pctCalipso(plan)} | ${tonosSilencio(plan)} tonos de silencio | ${reporte(plan)}`);
  }

  const general = await hojaTodas([...piezas, ...medios], 'Cintas v2, ronda 6d');
  const destino = join(SALIDA, 'hoja-general-ronda-6d.png');
  await writeFile(destino, general);
  console.log(`Hoja ${destino}`);
  console.log('Costo 0 USD');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'error');
  process.exit(1);
});
