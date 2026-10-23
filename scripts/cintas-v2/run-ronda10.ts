/**
 * Ronda 10. Aplica las paletas de respaldo. No llama al modelo.
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-ronda10.ts
 */
import { readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { config } from 'dotenv';
import sharp from 'sharp';
import { colorearV9 } from '@/lib/cintas-v2/compose/color-v9';
import { revisarV8 } from '@/lib/cintas-v2/compose/color-v8';
import { tonoCercano } from '@/lib/cintas-v2/compose/color-v3';
import { ANCHO, componerCintas, type PlanCintas, type SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import { PALETA_MADRE, TONOS_MADRE, type TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { leerImagen } from '@/lib/cintas-v2/prepare/vision';
import { MODELO_LENGUAJE } from '@/lib/cintas-v2/modelos';
import { comprenderRelato, PRIVACIDAD_ANALISIS, type ResultadoAnalisis } from '@/lib/cintas-v2/understand/analyze';
import { AnalisisSchema, clasificarLuz, colorPropio, type Analisis } from '@/lib/cintas-v2/understand/schema';
import type { Emocion } from '@/lib/cintas-v2/palette';
import { CASOS_TEXTO, FECHA_PIE } from '@/scripts/cintas-v2/fixtures';
import { hojaTodas } from '@/scripts/cintas-v2/hoja';
import { pngV2, type Pie } from '@/scripts/cintas-v2/raster';

const TOPE_DERIVA = 0.15;
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
  return !momento.imagenes.some((img) => img.tono && colorPropio(img.descripcion) === img.tono && !clasificarLuz(img.descripcion));
}

function afectada(analisis: Analisis): boolean {
  return analisis.momentos.some((momento) => {
    if (!Array.isArray(momento.imagenes)) return false;
    return momento.imagenes.some((img) => img.tono && colorPropio(img.descripcion) !== img.tono);
  });
}

function tonoDeBanda(hex: string): TonoMadre {
  return PALETA_MADRE.find((item) => item.hex.toUpperCase() === hex.toUpperCase())?.tono ?? tonoCercano(hex);
}

async function main() {
  config({ path: resolve('.env.local') });
  await mkdir(join(SALIDA, 'v10'), { recursive: true });

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

  const gasto = 0;

  const evitar = (process.env.CINTAS_EVITAR ?? '').split(',').filter(Boolean) as TonoMadre[];
  let clarosAnchos = 0;
  let clarosTristes = 0;
  let franjasLuz = 0;
  const piezas: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  const grises: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  const anchos = new Map<TonoMadre, number>();
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
      soloGeometria: true,
    });
    let coloresPorMomento: TonoMadre[][] = analisis.momentos.map(() => []);
    const forzar = trabajo.id === 'video';
    if (forzar) coloresPorMomento = await tonosVideo(analisis.momentos.length);
    if (trabajo.foto) {
      const tonos = await tonosDeArchivo(trabajo.foto);
      coloresPorMomento = analisis.momentos.map((momento) => (sinColor(momento) ? tonos : []));
    }
    const v9 = colorearV9({ id: trabajo.id, analisis, plan, coloresPorMomento, forzarColores: forzar, evitar });
    const fallas = revisarV8(v9.plan, v9.protagonista.tono);
    if (fallas.length > 0) console.log(`${trabajo.id} revisión: ${fallas.join('; ')}`);
    const dichas = analisis.momentos
      .map((momento) => momento.valencia)
      .filter((valor): valor is number => typeof valor === 'number');
    const luzMedia = dichas.length > 0 ? dichas.reduce((suma, valor) => suma + valor, 0) / dichas.length : analisis.animo.valencia;
    const luzBaja = luzMedia < 0.4;
    for (const banda of v9.plan.bandas) {
      const tono = tonoDeBanda(banda.hex);
      anchos.set(tono, (anchos.get(tono) ?? 0) + banda.ancho);
      const nivel = PALETA_MADRE.find((item) => item.hex.toUpperCase() === banda.hex.toUpperCase())?.nivel ?? 3;
      if (nivel >= 4 && banda.ancho > Math.round(ANCHO * 0.1)) clarosAnchos += 1;
      if (luzBaja && nivel >= 4) clarosTristes += 1;
      if ((nivel >= 4 || tono === 'amarillo' || tono === 'lima') && banda.ancho > Math.round(ANCHO * 0.1)) franjasLuz += 1;
    }
    console.log(`PALETA ${trabajo.titulo} | ${v9.paleta ?? ''} | ${v9.protagonista.nombre} | ${v9.protagonista.razon}${v9.mensaje ? ' | ' + v9.mensaje : ''}`);
    await writeFile(
      join(SALIDA, 'v10', `${trabajo.id}.json`),
      JSON.stringify({ mensaje: v9.mensaje, protagonista: v9.protagonista, paleta: v9.paleta, razones: v9.razones }, null, 2)
    );
    const pie: Pie = { titulo: trabajo.titulo, ciudad: trabajo.ciudad, pais: trabajo.pais, at: FECHA_PIE, locale: trabajo.locale };
    const png = await pngV2(v9.plan.bandas, pie);
    const gris = await sharp(png).grayscale().png().toBuffer();
    piezas.push({ titulo: trabajo.titulo, modo: v9.plan.modo, png });
    grises.push({ titulo: trabajo.titulo, modo: v9.plan.modo, png: gris });
  }

  const general = await hojaTodas(piezas, 'Cintas v10, ronda 10');
  const hojaGris = await hojaTodas(grises, 'Cintas v10 en grises');
  await writeFile(join(SALIDA, 'hoja-general-ronda-10.png'), general);
  await writeFile(join(SALIDA, 'hoja-general-ronda-10-grises.png'), hojaGris);
  const total = [...anchos.values()].reduce((s, n) => s + n, 0) || 1;
  const deriva = TONOS_MADRE.map((tono) => ({ tono, parte: (anchos.get(tono) ?? 0) / total }));
  for (const fila of deriva) console.log(`DERIVA ${fila.tono} ${(fila.parte * 100).toFixed(1)}%`);
  const altos = deriva.filter((fila) => fila.parte > TOPE_DERIVA);
  if (altos.length > 0) console.log(`DERIVA SUPERA ${altos.map((fila) => fila.tono).join(', ')}`);
  console.log(`Claros anchos ${clarosAnchos}. Claros en historias tristes ${clarosTristes}. Franjas luminosas anchas ${franjasLuz}.`);
  console.log(`Costo ${gasto.toFixed(4)} USD. Hojas ${piezas.length}.`);
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***'));
  process.exit(1);
});
