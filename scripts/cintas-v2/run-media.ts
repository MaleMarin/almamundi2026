/**
 * Material de Ana. Solo cuando tmp-cintas-v2/entrada ya existe.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-media.ts
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, resolve } from 'node:path';
import { config } from 'dotenv';
import { FECHA_PIE } from '@/lib/cintas-v2/fixtures';
import { componerCintas } from '@/lib/cintas-v2/compose/layout';
import { rutaFfmpegStatic } from '@/lib/cintas-v2/prepare/ffmpeg-bin';
import { extraerVideo } from '@/lib/cintas-v2/prepare/frames';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { silenciosPorMomento, transcribirArchivo } from '@/lib/cintas-v2/prepare/transcribe';
import { describirImagen, leerImagen } from '@/lib/cintas-v2/prepare/vision';
import { comprenderRelato } from '@/lib/cintas-v2/understand/analyze';
import { pngActual, pngV2 } from '@/scripts/cintas-v2/raster';
import { hojaPorCaso, hojaTodas, resumenAnalisis } from '@/scripts/cintas-v2/hoja';

const ENTRADA = resolve('tmp-cintas-v2/entrada');
const SALIDA = resolve('tmp-cintas-v2/salida');
const TRABAJO = resolve('tmp-cintas-v2/trabajo');

const AUDIO = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']);
const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv']);
const FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']);

function abrir(dir: string) {
  const child = spawn('open', [dir], { stdio: 'ignore', detached: true });
  child.unref();
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
    console.error('Cuando ~/Desktop/prueba-cintas esté lista, avisa y la copio ahí.');
    process.exit(1);
  }
  const videos = nombres.filter((n) => VIDEO.has(extname(n).toLowerCase()));
  if (videos.length > 0) {
    try {
      rutaFfmpegStatic();
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Falta ffmpeg-static.');
      process.exit(1);
    }
  }

  await mkdir(join(SALIDA, 'media'), { recursive: true });
  const piezas: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  const costos: Array<Record<string, unknown>> = [];
  let fotos = 0;

  for (const nombre of [...nombres].sort()) {
    const ext = extname(nombre).toLowerCase();
    const ruta = join(ENTRADA, nombre);
    if (FOTO.has(ext)) {
      fotos += 1;
      const id = `foto-${fotos}`;
      const titulo = `Foto de prueba ${fotos}`;
      const buffer = await leerImagen(ruta);
      const colores = await coloresDominantes(buffer, 5);
      const vision = await describirImagen(ruta, apiKey);
      const texto = `${vision.escena} ${vision.atmosfera}`;
      const analisis = await comprenderRelato({ texto, locale: 'es', apiKey });
      const plan = componerCintas({
        id,
        analisis: analisis.analisis,
        texto,
        locale: 'es',
        coloresImagen: colores,
      });
      const pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' as const };
      const actual = await pngActual({ id, texto, pie });
      const v2 = await pngV2(plan.bandas, pie);
      const resumen = resumenAnalisis(analisis.analisis, plan.modo, analisis.origen, analisis.detalle);
      const hoja = await hojaPorCaso({ titulo, actual, v2, resumen });
      await writeFile(join(SALIDA, 'media', `${id}-actual.png`), actual);
      await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
      await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
      await writeFile(
        join(SALIDA, 'media', `${id}.json`),
        JSON.stringify({ id, colores, vision: { escena: vision.escena, atmosfera: vision.atmosfera, emociones: vision.emociones }, analisis, plan }, null, 2)
      );
      const costo = vision.costoUsd + analisis.costoUsd;
      costos.push({
        id,
        minutosTranscritos: 0,
        tokensEntrada: vision.tokensEntrada + analisis.tokensEntrada,
        tokensSalida: vision.tokensSalida + analisis.tokensSalida,
        costoUsd: Number(costo.toFixed(6)),
        origen: analisis.origen,
      });
      piezas.push({ titulo, modo: plan.modo, png: v2 });
      console.log(`${id}: ${analisis.origen} ${costo.toFixed(6)} USD`);
    } else if (AUDIO.has(ext) || VIDEO.has(ext)) {
      const id = VIDEO.has(ext) ? 'video' : 'audio';
      const titulo = VIDEO.has(ext) ? 'Video de prueba' : 'Audio de prueba';
      let archivoAudio = ruta;
      let colores: string[] = [];
      let textoVisual = '';
      let costoVision = 0;
      let tokensE = 0;
      let tokensS = 0;
      if (VIDEO.has(ext)) {
        const extraido = await extraerVideo(ruta, join(TRABAJO, 'video'));
        archivoAudio = extraido.audioPath;
        for (const cuadro of extraido.cuadros) {
          const buf = await readFile(cuadro);
          const cols = await coloresDominantes(buf, 3);
          colores.push(...cols);
          const vision = await describirImagen(cuadro, apiKey);
          costoVision += vision.costoUsd;
          tokensE += vision.tokensEntrada;
          tokensS += vision.tokensSalida;
          textoVisual += ` ${vision.escena} ${vision.atmosfera}`;
        }
        colores = colores.slice(0, 5);
      }
      const transcripcion = await transcribirArchivo(archivoAudio, apiKey);
      const texto = `${transcripcion.texto}\n${textoVisual}`.trim();
      const analisis = await comprenderRelato({ texto, locale: 'es', apiKey });
      const silencios = silenciosPorMomento(
        transcripcion.silencios,
        transcripcion.minutos * 60,
        analisis.analisis.momentos.length
      );
      const plan = componerCintas({
        id,
        analisis: analisis.analisis,
        texto,
        locale: 'es',
        silencios,
        coloresImagen: colores,
      });
      const pie = { titulo, ciudad: 'Prueba', pais: 'Local', at: FECHA_PIE, locale: 'es' as const };
      const actual = await pngActual({ id, texto: transcripcion.texto || texto, pie });
      const v2 = await pngV2(plan.bandas, pie);
      const resumen = resumenAnalisis(analisis.analisis, plan.modo, analisis.origen, analisis.detalle);
      const hoja = await hojaPorCaso({ titulo, actual, v2, resumen });
      await writeFile(join(SALIDA, 'media', `${id}-actual.png`), actual);
      await writeFile(join(SALIDA, 'media', `${id}-v2.png`), v2);
      await writeFile(join(SALIDA, 'media', `${id}-hoja.png`), hoja);
      await writeFile(
        join(SALIDA, 'media', `${id}.json`),
        JSON.stringify(
          {
            id,
            minutos: transcripcion.minutos,
            segmentos: transcripcion.segmentos,
            silencios: transcripcion.silencios,
            detalleSegmentos: transcripcion.detalleSegmentos,
            texto: transcripcion.texto,
            analisis,
            plan,
          },
          null,
          2
        )
      );
      const costo = transcripcion.costoUsd + costoVision + analisis.costoUsd;
      costos.push({
        id,
        minutosTranscritos: Number(transcripcion.minutos.toFixed(3)),
        tokensEntrada: tokensE + analisis.tokensEntrada,
        tokensSalida: tokensS + analisis.tokensSalida,
        costoUsd: Number(costo.toFixed(6)),
        origen: analisis.origen,
      });
      piezas.push({ titulo, modo: plan.modo, png: v2 });
      console.log(`${id}: ${analisis.origen} ${transcripcion.minutos.toFixed(2)} min ${costo.toFixed(6)} USD`);
    }
  }

  if (piezas.length === 0) {
    console.error('La carpeta de entrada no tiene audio, video ni fotos reconocibles.');
    process.exit(1);
  }
  const todas = await hojaTodas(piezas);
  await writeFile(join(SALIDA, 'media', 'todas-v2.png'), todas);
  const previo = await readFile(join(SALIDA, 'costos.json'), 'utf8').catch(() => '');
  let base: { casos?: unknown[]; totalUsd?: number } = {};
  if (previo) {
    try {
      base = JSON.parse(previo) as { casos?: unknown[]; totalUsd?: number };
    } catch {
      base = {};
    }
  }
  const casos = [...(Array.isArray(base.casos) ? base.casos : []), ...costos];
  const total = casos.reduce((s, c) => s + Number((c as { costoUsd?: number }).costoUsd ?? 0), 0);
  await writeFile(
    join(SALIDA, 'costos.json'),
    JSON.stringify({ ...(typeof base === 'object' ? base : {}), casos, totalUsd: Number(total.toFixed(6)), media: costos }, null, 2)
  );
  console.log(`Salida ${join(SALIDA, 'media')}`);
  abrir(join(SALIDA, 'media'));
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***'));
  process.exit(1);
});
