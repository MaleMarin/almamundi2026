/**
 * Material de prueba. Lee el análisis guardado y solo llama al modelo si falta.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-media.ts
 */
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { config } from 'dotenv';
import { CASOS_TEXTO, FECHA_PIE } from '@/lib/cintas-v2/fixtures';
import { componerCintas, type SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import { MODELO_LENGUAJE } from '@/lib/cintas-v2/modelos';
import { rutaFfmpegStatic } from '@/lib/cintas-v2/prepare/ffmpeg-bin';
import { extraerVideo } from '@/lib/cintas-v2/prepare/frames';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { detectarSilencios } from '@/lib/cintas-v2/prepare/silencios';
import { transcribirArchivo, type Transcripcion } from '@/lib/cintas-v2/prepare/transcribe';
import { describirImagen, leerImagen, type DescripcionVisual } from '@/lib/cintas-v2/prepare/vision';
import { comprenderRelato, PRIVACIDAD_ANALISIS, type ResultadoAnalisis } from '@/lib/cintas-v2/understand/analyze';
import { pngActual, pngV2 } from '@/scripts/cintas-v2/raster';
import { hojaPorCaso, hojaTodas, resumenAnalisis } from '@/scripts/cintas-v2/hoja';

const ENTRADA = resolve('tmp-cintas-v2/entrada');
const SALIDA = resolve('tmp-cintas-v2/salida');
const TRABAJO = resolve('tmp-cintas-v2/trabajo');
const ANALISIS = resolve('tmp-cintas-v2/analisis');
const RONDA1 = resolve('tmp-cintas-v2/salida/ronda-1');

const AUDIO = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']);
const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv']);
const FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']);

type VisionGuardada = {
  escena: string;
  atmosfera: string;
  emociones: DescripcionVisual['emociones'];
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
};

type CacheMedia = {
  id: string;
  modelo?: string;
  transcripcion?: Transcripcion;
  silencios?: SilencioMarca[];
  duracion?: number;
  vision?: VisionGuardada;
  cuadros?: VisionGuardada[];
  versionPrivacidad?: number;
  analisis?: ResultadoAnalisis;
};

function limpiar(mensaje: string): string {
  return mensaje
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***')
    .replace(/Bearer\s+\S+/gi, 'Bearer ***')
    .replace(/tmp-cintas-v2\/entrada\/\S+/g, 'entrada/archivo')
    .replace(/\/Users\/\S+/g, 'archivo');
}

async function leerCache(id: string): Promise<CacheMedia> {
  const crudo = await readFile(join(ANALISIS, `${id}.json`), 'utf8').catch(() => '');
  if (!crudo) return { id };
  try {
    return { ...(JSON.parse(crudo) as CacheMedia), id };
  } catch {
    return { id };
  }
}

async function guardar(cache: CacheMedia): Promise<void> {
  await writeFile(join(ANALISIS, `${cache.id}.json`), JSON.stringify(cache, null, 2));
}

function visionDesde(valor: DescripcionVisual): VisionGuardada {
  return {
    escena: valor.escena,
    atmosfera: valor.atmosfera,
    emociones: valor.emociones,
    tokensEntrada: valor.tokensEntrada,
    tokensSalida: valor.tokensSalida,
    costoUsd: valor.costoUsd,
  };
}

async function visionPrevia(id: string): Promise<VisionGuardada | null> {
  const viejo = await readFile(join(SALIDA, 'media', `${id}.json`), 'utf8').catch(() => '');
  if (!viejo) return null;
  try {
    const json = JSON.parse(viejo) as { vision?: { escena?: string; atmosfera?: string; emociones?: VisionGuardada['emociones'] } };
    if (!json.vision?.escena || !json.vision.atmosfera) return null;
    return {
      escena: json.vision.escena,
      atmosfera: json.vision.atmosfera,
      emociones: json.vision.emociones ?? [{ emocion: 'calma', peso: 0.5 }],
      tokensEntrada: 0,
      tokensSalida: 0,
      costoUsd: 0,
    };
  } catch {
    return null;
  }
}

async function asegurarAnterior(id: string): Promise<Buffer> {
  const destino = join(RONDA1, `${id}.png`);
  if (!(await readFile(destino).then(() => true, () => false))) {
    await copyFile(join(SALIDA, 'media', `${id}-v2.png`), destino);
  }
  return readFile(destino);
}

async function main() {
  config({ path: resolve('.env.local') });
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  if (!apiKey) {
    console.error('Falta OPENAI_API_KEY en .env.local. No la pegues en el chat.');
    process.exit(2);
  }
  let nombres: string[] = [];
  try {
    nombres = (await readdir(ENTRADA)).filter((n) => !n.startsWith('.'));
  } catch {
    console.error('Todavía no está tmp-cintas-v2/entrada.');
    process.exit(1);
  }
  if (nombres.some((n) => VIDEO.has(extname(n).toLowerCase()) || AUDIO.has(extname(n).toLowerCase()))) {
    rutaFfmpegStatic();
  }

  await mkdir(join(SALIDA, 'media'), { recursive: true });
  await mkdir(ANALISIS, { recursive: true });
  await mkdir(RONDA1, { recursive: true });
  const piezas: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  const costos: Array<Record<string, unknown>> = [];
  let fotos = 0;
  const conteoSilencios: Record<string, number> = {};

  for (const nombre of [...nombres].sort()) {
    const ext = extname(nombre).toLowerCase();
    const ruta = join(ENTRADA, nombre);
    if (FOTO.has(ext)) {
      fotos += 1;
      const id = `foto-${fotos}`;
      const titulo = `Foto de prueba ${fotos}`;
      const cache = await leerCache(id);
      const buffer = await leerImagen(ruta);
      const colores = await coloresDominantes(buffer, 5);
      if (!cache.vision) {
        cache.vision = (await visionPrevia(id)) ?? visionDesde(await describirImagen(ruta, apiKey));
        await guardar(cache);
      }
      const texto = `${cache.vision.escena} ${cache.vision.atmosfera}`;
      if (!cache.analisis || cache.modelo !== MODELO_LENGUAJE || cache.versionPrivacidad !== PRIVACIDAD_ANALISIS) {
        cache.analisis = await comprenderRelato({ texto, locale: 'es', apiKey, modelo: MODELO_LENGUAJE });
        cache.modelo = MODELO_LENGUAJE;
        cache.versionPrivacidad = PRIVACIDAD_ANALISIS;
        await guardar(cache);
      }
      const plan = componerCintas({
        id,
        analisis: cache.analisis.analisis,
        texto,
        locale: 'es',
        coloresImagen: colores,
      });
      const pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' as const };
      const actual = await pngActual({ id, texto, pie });
      const v2 = await pngV2(plan.bandas, pie);
      const anterior = await asegurarAnterior(id);
      const resumen = resumenAnalisis(cache.analisis.analisis, plan.modo, cache.analisis.origen, cache.analisis.detalle);
      const hoja = await hojaPorCaso({ titulo, actual, v2, anterior, resumen });
      await writeFile(join(SALIDA, 'media', `${id}-actual.png`), actual);
      await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
      await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
      await writeFile(
        join(SALIDA, 'media', `${id}.json`),
        JSON.stringify({ id, colores, vision: cache.vision, analisis: cache.analisis, plan }, null, 2)
      );
      const costo = cache.vision.costoUsd + cache.analisis.costoUsd;
      costos.push({
        id,
        minutosTranscritos: 0,
        tokensEntrada: cache.vision.tokensEntrada + cache.analisis.tokensEntrada,
        tokensSalida: cache.vision.tokensSalida + cache.analisis.tokensSalida,
        costoUsd: Number(costo.toFixed(6)),
        origen: cache.analisis.origen,
        silencios: 0,
      });
      piezas.push({ titulo, modo: plan.modo, png: v2 });
      console.log(`${id}: ${cache.analisis.origen} ${costo.toFixed(6)} USD`);
    } else if (AUDIO.has(ext) || VIDEO.has(ext)) {
      const id = VIDEO.has(ext) ? 'video' : 'audio';
      const titulo = VIDEO.has(ext) ? 'Video de prueba' : 'Audio de prueba';
      const cache = await leerCache(id);
      let archivoAudio = ruta;
      let colores: string[] = [];
      if (VIDEO.has(ext)) {
        const extraido = await extraerVideo(ruta, join(TRABAJO, 'video'));
        archivoAudio = extraido.audioPath;
        cache.cuadros = cache.cuadros ?? [];
        for (let i = 0; i < extraido.cuadros.length; i++) {
          const cuadro = extraido.cuadros[i]!;
          const buf = await readFile(cuadro);
          colores.push(...(await coloresDominantes(buf, 3)));
          if (!cache.cuadros[i]) {
            cache.cuadros[i] = visionDesde(await describirImagen(cuadro, apiKey));
            await guardar(cache);
          }
        }
        colores = colores.slice(0, 5);
      }
      if (!cache.transcripcion) {
        cache.transcripcion = await transcribirArchivo(archivoAudio, apiKey);
        await guardar(cache);
      }
      if (!cache.silencios || !cache.duracion) {
        const medidos = await detectarSilencios(archivoAudio);
        cache.silencios = medidos.silencios;
        cache.duracion = medidos.duracion;
        await guardar(cache);
      }
      const textoVisual = (cache.cuadros ?? []).map((v) => `${v.escena} ${v.atmosfera}`).join(' ');
      const texto = `${cache.transcripcion.texto}\n${textoVisual}`.trim();
      if (!cache.analisis || cache.modelo !== MODELO_LENGUAJE || cache.versionPrivacidad !== PRIVACIDAD_ANALISIS) {
        cache.analisis = await comprenderRelato({ texto, locale: 'es', apiKey, modelo: MODELO_LENGUAJE });
        cache.modelo = MODELO_LENGUAJE;
        cache.versionPrivacidad = PRIVACIDAD_ANALISIS;
        await guardar(cache);
      }
      const plan = componerCintas({
        id,
        analisis: cache.analisis.analisis,
        texto: cache.transcripcion.texto || texto,
        locale: 'es',
        silencios: cache.silencios,
        duracionSegundos: cache.duracion,
        coloresImagen: colores,
      });
      const pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' as const };
      const actual = await pngActual({ id, texto: cache.transcripcion.texto || texto, pie });
      const v2 = await pngV2(plan.bandas, pie);
      const anterior = await asegurarAnterior(id);
      const resumen = resumenAnalisis(cache.analisis.analisis, plan.modo, cache.analisis.origen, cache.analisis.detalle);
      const hoja = await hojaPorCaso({ titulo, actual, v2, anterior, resumen });
      await writeFile(join(SALIDA, 'media', `${id}-actual.png`), actual);
      await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
      await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
      await writeFile(
        join(SALIDA, 'media', `${id}.json`),
        JSON.stringify(
          {
            id,
            minutos: cache.transcripcion.minutos,
            segmentos: cache.transcripcion.segmentos,
            silencios: cache.silencios,
            duracion: cache.duracion,
            texto: cache.transcripcion.texto,
            analisis: cache.analisis,
            plan,
          },
          null,
          2
        )
      );
      const costoVision = (cache.cuadros ?? []).reduce((s, v) => s + v.costoUsd, 0);
      const tokensE = (cache.cuadros ?? []).reduce((s, v) => s + v.tokensEntrada, 0);
      const tokensS = (cache.cuadros ?? []).reduce((s, v) => s + v.tokensSalida, 0);
      const costo = cache.transcripcion.costoUsd + costoVision + cache.analisis.costoUsd;
      conteoSilencios[id] = cache.silencios.length;
      costos.push({
        id,
        minutosTranscritos: Number(cache.transcripcion.minutos.toFixed(3)),
        tokensEntrada: tokensE + cache.analisis.tokensEntrada,
        tokensSalida: tokensS + cache.analisis.tokensSalida,
        costoUsd: Number(costo.toFixed(6)),
        origen: cache.analisis.origen,
        silencios: cache.silencios.length,
        transcripcionUsd: Number(cache.transcripcion.costoUsd.toFixed(6)),
        visionUsd: Number(costoVision.toFixed(6)),
        comprensionUsd: Number(cache.analisis.costoUsd.toFixed(6)),
      });
      piezas.push({ titulo, modo: plan.modo, png: v2 });
      console.log(
        `${id}: ${cache.analisis.origen} ${cache.transcripcion.minutos.toFixed(2)} min, silencios ${cache.silencios.length}, ${costo.toFixed(6)} USD`
      );
    }
  }

  if (piezas.length === 0) {
    console.error('La carpeta de entrada no tiene audio, video ni fotos reconocibles.');
    process.exit(1);
  }

  const todasMedios = await hojaTodas(piezas);
  await writeFile(join(SALIDA, 'media', 'todas-v2.png'), todasMedios);

  const piezasGenerales: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  for (const caso of CASOS_TEXTO) {
    const json = JSON.parse(await readFile(join(SALIDA, 'analisis', `${caso.id}.json`), 'utf8')) as { modo?: string };
    piezasGenerales.push({
      titulo: caso.titulo,
      modo: json.modo ?? '',
      png: await readFile(join(SALIDA, 'piezas', `${caso.id}-v2.png`)),
    });
  }
  piezasGenerales.push(...piezas);
  await writeFile(join(SALIDA, 'todas-v2.png'), await hojaTodas(piezasGenerales));

  const previo = await readFile(join(SALIDA, 'costos-ronda-2.json'), 'utf8').catch(() => '');
  const base = previo
    ? (JSON.parse(previo) as { totalUsd?: number; textosUsd?: number; casos?: unknown[]; media?: unknown[] })
    : {};
  const textosUsd = Number(base.textosUsd ?? (Array.isArray(base.media) ? 0 : base.totalUsd ?? 0));
  const mediaUsd = costos.reduce((s, c) => s + Number(c.costoUsd ?? 0), 0);
  const informe = {
    ronda: 2,
    modelo: MODELO_LENGUAJE,
    textos: base.casos ?? [],
    textosUsd,
    media: costos,
    mediaUsd: Number(mediaUsd.toFixed(6)),
    totalUsd: Number((textosUsd + mediaUsd).toFixed(6)),
    silencios: conteoSilencios,
  };
  await writeFile(join(SALIDA, 'costos-ronda-2.json'), JSON.stringify(informe, null, 2));
  console.log(`Silencios ${JSON.stringify(conteoSilencios)}`);
  console.log(`Costo de esta ronda ${informe.totalUsd.toFixed(6)} USD`);
  console.log(`Salida ${join(SALIDA, 'media')}`);
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(limpiar(mensaje));
  process.exit(1);
});
