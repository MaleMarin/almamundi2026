/**
 * Ronda 4. Reanaliza solo audio y video. El resto sale de los JSON guardados.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda4.ts
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { config } from 'dotenv';
import { CASOS_TEXTO, FECHA_PIE } from '@/lib/cintas-v2/fixtures';
import { componerCintas, type SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import { MODELO_LENGUAJE } from '@/lib/cintas-v2/modelos';
import { armonizar, esAcentoIntenso, esSuave } from '@/lib/cintas-v2/palette';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { leerImagen } from '@/lib/cintas-v2/prepare/vision';
import {
  analisisTieneDatosIdentificables,
  comprenderRelato,
  PRIVACIDAD_ANALISIS,
  type OrigenAnalisis,
} from '@/lib/cintas-v2/understand/analyze';
import { AnalisisSchema, type Analisis } from '@/lib/cintas-v2/understand/schema';
import type { Emocion } from '@/lib/cintas-v2/palette';
import { pngV2, type Pie } from '@/scripts/cintas-v2/raster';
import { hojaPorCaso, hojaTodas, resumenAnalisis } from '@/scripts/cintas-v2/hoja';

const SALIDA = resolve('tmp-cintas-v2/salida');
const RONDA1 = join(SALIDA, 'ronda-1');
const CACHE = resolve('tmp-cintas-v2/analisis');
const ENTRADA = resolve('tmp-cintas-v2/entrada');
const FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']);

type Guardado = {
  analisis: Analisis;
  origen: OrigenAnalisis;
  detalle: string | null;
};

type PiezaHoja = { titulo: string; modo: string; png: Buffer };

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
    .sort((a, b) => b.peso - a.peso)
    .slice(0, 8);
  if (mezcla.length === 0) return analisis;
  return { ...analisis, emociones: mezcla };
}

function resumenCinta(plan: ReturnType<typeof componerCintas>): string {
  const ancho = (pred: (hex: string) => boolean) =>
    plan.bandas.filter((b) => pred(b.hex)).reduce((s, b) => s + b.ancho, 0);
  const colores = [...new Set(plan.bandas.map((b) => b.hex))].join(' ');
  const deFoto = [...new Set(plan.bandas.filter((b) => b.motivo === 'color-imagen').map((b) => b.hex))].join(' ');
  return [
    `modo ${plan.modo}`,
    `suave ${ancho(esSuave)}px`,
    `acento ${ancho(esAcentoIntenso)}px`,
    `cinta ${colores}`,
    `de la foto ${deFoto || 'ninguno'}`,
  ].join(' | ');
}

async function guardarHoja(
  id: string,
  titulo: string,
  plan: ReturnType<typeof componerCintas>,
  guardado: Guardado,
  carpeta: 'piezas' | 'media',
  pie: Pie
): Promise<PiezaHoja> {
  const v2 = await pngV2(plan.bandas, pie);
  const actual = await readFile(join(SALIDA, carpeta, carpeta === 'piezas' ? `${id}-actual.png` : `${id}-actual.png`));
  const anterior = await readFile(join(RONDA1, `${id}.png`));
  const resumen = resumenAnalisis(guardado.analisis, plan.modo, guardado.origen, guardado.detalle);
  const hoja = await hojaPorCaso({ titulo, actual, v2, anterior, resumen });
  if (carpeta === 'piezas') {
    await writeFile(join(SALIDA, 'piezas', `${id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'por-caso', `${id}.png`), hoja);
  } else {
    await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
    await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
  }
  return { titulo, modo: plan.modo, png: v2 };
}

async function main() {
  config({ path: resolve('.env.local') });
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  if (!apiKey) {
    console.error('Falta OPENAI_API_KEY en .env.local. No la pegues en el chat.');
    process.exit(2);
  }

  const piezas: PiezaHoja[] = [];
  const fotosPiezas: PiezaHoja[] = [];
  for (const caso of CASOS_TEXTO) {
    const json = await leer(join(CACHE, `${caso.id}.json`));
    const guardado = analisisDe(json);
    const plan = componerCintas({ id: caso.id, analisis: guardado.analisis, texto: caso.texto, locale: caso.locale });
    const pie: Pie = { titulo: caso.titulo, ciudad: caso.ciudad, pais: caso.pais, at: FECHA_PIE, locale: caso.locale };
    piezas.push(await guardarHoja(caso.id, caso.titulo, plan, guardado, 'piezas', pie));
    console.log(`${caso.id}: ${plan.modo}`);
  }

  const nombres = (await readdir(ENTRADA)).filter((n) => !n.startsWith('.')).sort();
  const rutasFoto = new Map<string, string>();
  let nFoto = 0;
  for (const nombre of nombres) {
    if (!FOTO.has(extname(nombre).toLowerCase())) continue;
    nFoto += 1;
    rutasFoto.set(`foto-${nFoto}`, join(ENTRADA, nombre));
  }

  for (const id of ['foto-1', 'foto-2']) {
    const json = await leer(join(CACHE, `${id}.json`));
    const guardado = analisisDe(json);
    if (analisisTieneDatosIdentificables(guardado.analisis)) {
      console.error(`${id}: el análisis guardado tiene datos identificables. No lo vuelvo a mandar al modelo.`);
      process.exit(1);
    }
    const vision = json.vision as { escena?: string; atmosfera?: string; emociones?: Array<{ emocion: Emocion; peso: number }> };
    const texto = `${vision?.escena ?? ''} ${vision?.atmosfera ?? ''}`.trim();
    const analisis = conPesoVisual(guardado.analisis, vision?.emociones ?? []);
    const ruta = rutasFoto.get(id);
    if (!ruta) {
      console.error(`Falta la imagen de ${id}.`);
      process.exit(1);
    }
    const colores = await coloresDominantes(await leerImagen(ruta), 5);
    const plan = componerCintas({
      id,
      analisis,
      texto,
      locale: 'es',
      coloresImagen: colores,
    });
    const titulo = id === 'foto-1' ? 'Foto de prueba 1' : 'Foto de prueba 2';
    const pie: Pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' };
    fotosPiezas.push(await guardarHoja(id, titulo, plan, { ...guardado, analisis }, 'media', pie));
    json.versionPrivacidad = PRIVACIDAD_ANALISIS;
    await writeFile(join(CACHE, `${id}.json`), JSON.stringify(json, null, 2));
    console.log(`${id} reales ${colores.join(' ')}`);
    console.log(`${id} mezcla ${colores.map((hex) => armonizar(hex)).join(' ')}`);
    console.log(`${id} ${resumenCinta(plan)}`);
  }

  let gasto = 0;
  const detalle: Array<{ id: string; costoUsd: number; origen: string }> = [];
  for (const id of ['audio', 'video'] as const) {
    const json = await leer(join(CACHE, `${id}.json`));
    const transcripcion = json.transcripcion as { texto?: string } | undefined;
    const cuadros = (json.cuadros as Array<{ escena?: string; atmosfera?: string }> | undefined) ?? [];
    const visual = cuadros.map((c) => `${c.escena ?? ''} ${c.atmosfera ?? ''}`).join(' ');
    const texto = `${transcripcion?.texto ?? ''}\n${visual}`.trim();
    const guardadoPrevio = analisisDe(json);
    const yaPrivado = json.versionPrivacidad === PRIVACIDAD_ANALISIS && !analisisTieneDatosIdentificables(guardadoPrevio.analisis);
    const resultado = yaPrivado
      ? {
          analisis: guardadoPrevio.analisis,
          origen: guardadoPrevio.origen,
          detalle: guardadoPrevio.detalle,
          costoUsd: 0,
        }
      : await comprenderRelato({ texto, locale: 'es', apiKey, modelo: MODELO_LENGUAJE });
    if (!yaPrivado) {
      if (analisisTieneDatosIdentificables(resultado.analisis)) {
        console.error(`${id}: el análisis nuevo todavía tiene datos identificables. No lo guardo.`);
        process.exit(1);
      }
      json.analisis = resultado;
      json.modelo = MODELO_LENGUAJE;
      json.versionPrivacidad = PRIVACIDAD_ANALISIS;
      await writeFile(join(CACHE, `${id}.json`), JSON.stringify(json, null, 2));
    }
    gasto += resultado.costoUsd;
    detalle.push({ id, costoUsd: Number(resultado.costoUsd.toFixed(6)), origen: resultado.origen });
    console.log(`${id}: ${resultado.origen} ${resultado.costoUsd.toFixed(6)} USD`);
    for (const momento of resultado.analisis.momentos) {
      console.log(`- ${momento.resumen} [${momento.emocion} ${momento.intensidad.toFixed(2)}]`);
    }
    const plan = componerCintas({
      id,
      analisis: resultado.analisis,
      texto,
      locale: 'es',
      silencios: (json.silencios as SilencioMarca[]) ?? [],
      duracionSegundos: Number(json.duracion ?? 0),
    });
    const titulo = id === 'audio' ? 'Audio de prueba' : 'Video de prueba';
    const pie: Pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' };
    piezas.push(
      await guardarHoja(id, titulo, plan, { analisis: resultado.analisis, origen: resultado.origen, detalle: resultado.detalle }, 'media', pie)
    );
    console.log(`${id} ${resumenCinta(plan)}`);
  }

  const general = await hojaTodas([...piezas, ...fotosPiezas], 'Cintas v2, ronda 4');
  const destino = join(SALIDA, 'hoja-general-ronda-4.png');
  await writeFile(destino, general);
  if (gasto > 0) {
    await writeFile(
      join(SALIDA, 'costos-ronda-4.json'),
      JSON.stringify({ nuevoUsd: Number(gasto.toFixed(6)), detalle }, null, 2)
    );
  }
  console.log(`Hoja ${destino}`);
  console.log(gasto > 0 ? `Costo nuevo ${gasto.toFixed(6)} USD` : 'Sin llamadas nuevas al modelo');
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***').replace(/\/Users\/\S+/g, 'archivo'));
  process.exit(1);
});
