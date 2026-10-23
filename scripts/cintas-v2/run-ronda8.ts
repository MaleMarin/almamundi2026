/**
 * Ronda 8. La luz no elige tono. El ancho sigue la ley de la extensión.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda8.ts
 * Con --componer no llama al modelo y solo arma las cintas.
 */
import { readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { config } from 'dotenv';
import sharp from 'sharp';
import { colorearV8, revisarV8 } from '@/lib/cintas-v2/compose/color-v8';
import { tonoCercano } from '@/lib/cintas-v2/compose/color-v3';
import { componerCintas, type PlanCintas, type SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import type { TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { leerImagen } from '@/lib/cintas-v2/prepare/vision';
import { MODELO_LENGUAJE } from '@/lib/cintas-v2/modelos';
import { comprenderRelato, PRIVACIDAD_ANALISIS, type ResultadoAnalisis } from '@/lib/cintas-v2/understand/analyze';
import { AnalisisSchema, clasificarLuz, relatoTieneLuz, type Analisis } from '@/lib/cintas-v2/understand/schema';
import type { Emocion } from '@/lib/cintas-v2/palette';
import { CASOS_TEXTO, FECHA_PIE } from '@/scripts/cintas-v2/fixtures';
import { hojaTodas } from '@/scripts/cintas-v2/hoja';
import { pngV2, type Pie } from '@/scripts/cintas-v2/raster';

const TOPE = 0.3;
const RESERVA = 0.05;
const SALIDA = resolve('tmp-cintas-v2/salida');
const CACHE = resolve('tmp-cintas-v2/analisis');
const ENTRADA = resolve('tmp-cintas-v2/entrada');
const CUADROS = resolve('tmp-cintas-v2/trabajo/video');
const FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']);

type Trabajo = {
  id: string;
  titulo: string;
  texto: string;
  locale: 'es' | 'pt' | 'en';
  ciudad: string;
  pais: string;
  anidado: boolean;
  foto?: string;
};

function textoDe(json: Record<string, unknown>, id: string): string {
  if (id === 'video') {
    const dicho = (json.transcripcion as { texto?: string } | undefined)?.texto ?? '';
    const cuadros = Array.isArray(json.cuadros) ? json.cuadros : [];
    const visto = cuadros
      .map((cuadro) => {
        const fila = cuadro as { escena?: string; atmosfera?: string };
        return [fila.escena, fila.atmosfera].filter(Boolean).join('. ');
      })
      .filter(Boolean)
      .join('\n');
    return `${dicho}\n\nLo que se ve, en este orden:\n${visto}`.trim();
  }
  if (id === 'audio') return (json.transcripcion as { texto?: string } | undefined)?.texto ?? '';
  if (id.startsWith('foto')) {
    const vision = json.vision as { escena?: string; atmosfera?: string } | undefined;
    return [vision?.escena, vision?.atmosfera].filter(Boolean).join('\n');
  }
  return '';
}

async function guardar(ruta: string, json: Record<string, unknown>, resultado: ResultadoAnalisis, anidado: boolean): Promise<void> {
  if (anidado) json.analisis = resultado;
  else {
    json.analisis = resultado.analisis;
    json.origen = resultado.origen;
    json.detalle = resultado.detalle;
    json.reintentos = resultado.reintentos;
    json.tokensEntrada = resultado.tokensEntrada;
    json.tokensSalida = resultado.tokensSalida;
    json.costoUsd = resultado.costoUsd;
    json.modelo = MODELO_LENGUAJE;
  }
  json.versionPrivacidad = PRIVACIDAD_ANALISIS;
  await writeFile(ruta, JSON.stringify(json, null, 2));
}

function analisisPlano(json: Record<string, unknown>): Analisis {
  const crudo = json.analisis;
  const anidado = crudo && typeof crudo === 'object' && 'analisis' in crudo ? (crudo as { analisis: unknown }).analisis : crudo;
  return AnalisisSchema.parse(anidado);
}

async function tonosDeArchivo(ruta: string): Promise<TonoMadre[]> {
  const colores = await coloresDominantes(await leerImagen(ruta), 3);
  return colores.map((hex) => tonoCercano(hex));
}

async function tonosVideo(momentos: number): Promise<TonoMadre[][]> {
  const listas: TonoMadre[][] = Array.from({ length: momentos }, () => []);
  for (let i = 1; i <= 6; i++) {
    const momento = Math.min(momentos - 1, Math.floor(((i - 1) * momentos) / 6));
    try {
      listas[momento]!.push(...(await tonosDeArchivo(join(CUADROS, `cuadro-${i}.jpg`))));
    } catch {
      // Si falta un cuadro, el momento sigue con lo dicho.
    }
  }
  return listas;
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

function sinColor(momento: Analisis['momentos'][number]): boolean {
  if (!Array.isArray(momento.imagenes)) return true;
  return !momento.imagenes.some((img) => img.tono && !img.luz && !clasificarLuz(img.descripcion));
}

async function main() {
  config({ path: resolve('.env.local') });
  const args = process.argv.slice(2);
  const soloComponer = args.includes('--componer');
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  await mkdir(join(SALIDA, 'v8'), { recursive: true });

  const nombres = (await readdir(ENTRADA)).filter((n) => !n.startsWith('.')).sort();
  const fotos: string[] = [];
  for (const nombre of nombres) {
    if (FOTO.has(extname(nombre).toLowerCase())) fotos.push(join(ENTRADA, nombre));
  }

  const trabajos: Trabajo[] = CASOS_TEXTO.map((caso) => ({
    id: caso.id,
    titulo: caso.titulo,
    texto: caso.texto,
    locale: caso.locale,
    ciudad: caso.ciudad,
    pais: caso.pais,
    anidado: false,
  }));
  for (const id of ['audio', 'video'] as const) {
    const json = JSON.parse(await readFile(join(CACHE, `${id}.json`), 'utf8')) as Record<string, unknown>;
    trabajos.push({
      id,
      titulo: id === 'audio' ? 'Audio de prueba' : 'Video de prueba',
      texto: textoDe(json, id),
      locale: 'es',
      ciudad: 'Prueba',
      pais: 'Local',
      anidado: true,
    });
  }
  for (let i = 0; i < fotos.length; i++) {
    const id = `foto-${i + 1}`;
    const json = JSON.parse(await readFile(join(CACHE, `${id}.json`), 'utf8')) as Record<string, unknown>;
    trabajos.push({
      id,
      titulo: id === 'foto-1' ? 'Foto de prueba 1' : 'Foto de prueba 2',
      texto: textoDe(json, id),
      locale: 'es',
      ciudad: 'Prueba',
      pais: 'Local',
      anidado: true,
      foto: fotos[i],
    });
  }

  const conLuz = trabajos.filter((trabajo) => {
    const json = JSON.parse(readFileSync(join(CACHE, `${trabajo.id}.json`), 'utf8')) as Record<string, unknown>;
    return relatoTieneLuz(analisisPlano(json));
  });
  console.log(`Con luz: ${conLuz.map((t) => t.id).join(', ') || 'ninguno'}.`);

  let gasto = 0;
  if (!soloComponer) {
    if (!apiKey) throw new Error('Falta la clave para analizar. No se llamó al modelo.');
    const estimado = (conLuz.length * (1200 * 2 + 1400 * 10)) / 1_000_000;
    console.log(`Vuelvo a leer ${conLuz.length} relatos. Estimación ${estimado.toFixed(2)} USD, tope ${TOPE.toFixed(2)}.`);
    if (estimado > TOPE) {
      console.log('La estimación supera el tope. No llamé al modelo.');
      return;
    }
    for (const trabajo of conLuz) {
      if (gasto + RESERVA > TOPE) {
        console.log(`Me detengo en ${gasto.toFixed(3)} USD para no pasar el tope. Falta ${trabajo.id}.`);
        break;
      }
      const resultado = await comprenderRelato({
        texto: trabajo.texto,
        locale: trabajo.locale,
        apiKey,
        modelo: MODELO_LENGUAJE,
      });
      gasto += resultado.costoUsd;
      console.log(`${trabajo.id}: ${resultado.origen} ${resultado.costoUsd.toFixed(4)} USD, acumulado ${gasto.toFixed(4)}`);
      const ruta = join(CACHE, `${trabajo.id}.json`);
      const json = JSON.parse(await readFile(ruta, 'utf8')) as Record<string, unknown>;
      await guardar(ruta, json, resultado, trabajo.anidado);
      if (gasto > TOPE) break;
    }
  }

  const piezas: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  const grises: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  for (const trabajo of trabajos) {
    const json = JSON.parse(await readFile(join(CACHE, `${trabajo.id}.json`), 'utf8')) as Record<string, unknown>;
    const analisis = analisisPlano(json);
    const vision = json.vision as { emociones?: Array<{ emocion: Emocion; peso: number }> } | undefined;
    const paraForma = trabajo.foto ? conPesoVisual(analisis, vision?.emociones ?? []) : analisis;
    const plan: PlanCintas = componerCintas({
      id: trabajo.id,
      analisis: paraForma,
      texto: trabajo.texto,
      locale: trabajo.locale,
      silencios: (json.silencios as SilencioMarca[]) ?? [],
      duracionSegundos: Number(json.duracion ?? 0),
      coloresImagen: trabajo.foto ? await coloresDominantes(await leerImagen(trabajo.foto), 5) : undefined,
    });
    let coloresPorMomento: TonoMadre[][] = analisis.momentos.map(() => []);
    const forzar = trabajo.id === 'video';
    if (forzar) coloresPorMomento = await tonosVideo(analisis.momentos.length);
    if (trabajo.foto) {
      const tonos = await tonosDeArchivo(trabajo.foto);
      coloresPorMomento = analisis.momentos.map((momento) => (sinColor(momento) ? tonos : []));
    }
    const v8 = colorearV8({ id: trabajo.id, analisis, plan, coloresPorMomento, forzarColores: forzar });
    const fallas = revisarV8(v8.plan, v8.protagonista.tono);
    if (fallas.length > 0) console.log(`${trabajo.id} revisión: ${fallas.join('; ')}`);
    console.log(`PROTA ${trabajo.titulo} | ${v8.protagonista.nombre} | ${v8.protagonista.razon}${v8.mensaje ? ' | ' + v8.mensaje : ''}`);
    await writeFile(
      join(SALIDA, 'v8', `${trabajo.id}.json`),
      JSON.stringify({ mensaje: v8.mensaje, protagonista: v8.protagonista, razones: v8.razones }, null, 2)
    );
    const pie: Pie = { titulo: trabajo.titulo, ciudad: trabajo.ciudad, pais: trabajo.pais, at: FECHA_PIE, locale: trabajo.locale };
    const png = await pngV2(v8.plan.bandas, pie);
    const gris = await sharp(png).grayscale().png().toBuffer();
    piezas.push({ titulo: trabajo.titulo, modo: v8.plan.modo, png });
    grises.push({ titulo: trabajo.titulo, modo: v8.plan.modo, png: gris });
  }

  const general = await hojaTodas(piezas, 'Cintas v8, ronda 8');
  const hojaGris = await hojaTodas(grises, 'Cintas v8 en grises');
  await writeFile(join(SALIDA, 'hoja-general-ronda-8.png'), general);
  await writeFile(join(SALIDA, 'hoja-general-ronda-8-grises.png'), hojaGris);
  console.log(`Costo ${gasto.toFixed(4)} USD. Hojas ${piezas.length}.`);
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***'));
  process.exit(1);
});
