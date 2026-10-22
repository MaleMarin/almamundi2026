/**
 * Prototipo de textos. Desde la raíz del repo:
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-textos.ts
 * Comprobación sin API:
 * node --experimental-strip-types --import ./scripts/cintas-v2/register.mjs scripts/cintas-v2/run-textos.ts --comprobar
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { config } from 'dotenv';
import { hitsFromText } from '@/lib/huella/almamundi-lexicon';
import { CASOS_TEXTO, contarPalabras, FECHA_PIE, HISTORIAS } from '@/lib/cintas-v2/fixtures';
import { armonizar, hexRgb, luminancia } from '@/lib/cintas-v2/palette';
import { coloresDominantes } from '@/lib/cintas-v2/prepare/dominant-colors';
import { analisisDesdeDiccionario } from '@/lib/cintas-v2/understand/lexicon-fallback';
import { AnalisisSchema } from '@/lib/cintas-v2/understand/schema';
import type { Analisis } from '@/lib/cintas-v2/understand/schema';
import { comprenderRelato } from '@/lib/cintas-v2/understand/analyze';
import { componerCintas, esPocoContenido, type Modo } from '@/lib/cintas-v2/compose/layout';
import {
  MODELO_LENGUAJE,
  PRECIOS_LENGUAJE,
  PRECIO_ENTRADA_POR_MILLON,
  PRECIO_SALIDA_POR_MILLON,
} from '@/lib/cintas-v2/modelos';
import { pngActual, pngV2, type Pie } from '@/scripts/cintas-v2/raster';
import { hojaPorCaso, hojaTodas, resumenAnalisis } from '@/scripts/cintas-v2/hoja';

const SALIDA = resolve('tmp-cintas-v2/salida');

function pieDe(caso: (typeof CASOS_TEXTO)[number]): Pie {
  return {
    titulo: caso.titulo,
    ciudad: caso.ciudad,
    pais: caso.pais,
    at: FECHA_PIE,
    locale: caso.locale,
  };
}

function analisisBase(parcial: Partial<Analisis> & Pick<Analisis, 'animo' | 'emociones' | 'momentos'>): Analisis {
  return {
    palabrasClave: parcial.palabrasClave ?? [
      { palabra: 'casa', peso: 0.6 },
      { palabra: 'tarde', peso: 0.3 },
    ],
    idioma: parcial.idioma ?? 'es',
    avisos: parcial.avisos ?? { contenidoSensible: false, violencia: false, menores: false },
    animo: parcial.animo,
    emociones: parcial.emociones,
    momentos: parcial.momentos,
  };
}

function repetida(anchos: number[]): boolean {
  if (anchos.length < 4) return false;
  for (let p = 1; p <= Math.floor(anchos.length / 2); p++) {
    if (anchos.length % p !== 0) continue;
    let igual = true;
    for (let i = p; i < anchos.length; i++) {
      if (anchos[i] !== anchos[i - p]) {
        igual = false;
        break;
      }
    }
    if (igual && anchos.length / p >= 2) return true;
  }
  return false;
}

async function comprobar(): Promise<void> {
  const fallos: string[] = [];
  const decir = (ok: boolean, msg: string) => {
    if (!ok) fallos.push(msg);
    console.log(`${ok ? 'ok' : 'NO'} ${msg}`);
  };

  for (const historia of HISTORIAS) {
    const n = contarPalabras(historia.texto);
    decir(n >= 100 && n <= 250, `${historia.id} ${n} palabras`);
  }
  decir(HISTORIAS.some((h) => h.texto.toLowerCase().includes('no estaba triste')), 'hay negación en español');
  decir(HISTORIAS.some((h) => h.texto.toLowerCase().includes('se me apretó el pecho de alegría')), 'hay metáfora de alegría');
  decir(HISTORIAS.some((h) => h.texto.includes('todo salió perfecto')), 'hay ironía en el relato triste');
  decir(HISTORIAS.some((h) => h.locale === 'pt'), 'hay relato en portugués');
  decir(HISTORIAS.some((h) => h.locale === 'en'), 'hay relato en inglés');

  const muestra = AnalisisSchema.safeParse(
    analisisDesdeDiccionario('El amor sostiene la casa y la calma del domingo.', 'es')
  );
  decir(muestra.success, 'el respaldo valida con zod');

  const amor = analisisDesdeDiccionario('El amor', 'es');
  decir(amor.emociones.some((e) => e.emocion === 'amor') || amor.palabrasClave.some((p) => p.palabra === 'amor'), 'el diccionario reconoce amor');

  const negro = armonizar('#000000');
  decir(negro !== '#000000' && luminancia(negro) > 20, `armonizar negro da ${negro}`);

  const bloques = ['#E15A45', '#2C3E7A', '#E39A2D', '#2F8F8A', '#F0D2C4'];
  const raw = Buffer.alloc(50 * 40 * 3);
  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 50; x++) {
      const [r, g, b] = hexRgb(bloques[Math.min(4, Math.floor(x / 10))]!);
      const i = (y * 50 + x) * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const png = await sharp(raw, { raw: { width: 50, height: 40, channels: 3 } }).png().toBuffer();
  const dominantes = await coloresDominantes(png, 5);
  const cerca = (hex: string, esperado: string) => {
    const A = hexRgb(hex);
    const B = hexRgb(esperado);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 36;
  };
  decir(
    bloques.every((b) => dominantes.some((d) => cerca(d, b))),
    `colores dominantes ${dominantes.join(' ')}`
  );

  const largo = HISTORIAS[0]!.texto;
  const modos: Array<{ id: string; modo: Modo; analisis: Analisis; texto: string; locale: 'es' }> = [
    {
      id: 'sint-intensa',
      modo: 'intensa',
      texto: largo,
      locale: 'es',
      analisis: analisisBase({
        animo: { valencia: 0.72, activacion: 0.86, dominancia: 0.6 },
        emociones: [
          { emocion: 'alegría', peso: 0.8 },
          { emocion: 'amor', peso: 0.55 },
          { emocion: 'asombro', peso: 0.3 },
        ],
        momentos: [
          { resumen: 'el tren se retrasa', emocion: 'miedo', intensidad: 0.8 },
          { resumen: 'se dicen la verdad', emocion: 'amor', intensidad: 0.9 },
          { resumen: 'bajan bajo la lluvia', emocion: 'alegría', intensidad: 0.7 },
          { resumen: 'siguen hablando juntos', emocion: 'esperanza', intensidad: 0.6 },
        ],
      }),
    },
    {
      id: 'sint-triste',
      modo: 'triste',
      texto: largo,
      locale: 'es',
      analisis: analisisBase({
        animo: { valencia: 0.22, activacion: 0.34, dominancia: 0.28 },
        emociones: [
          { emocion: 'tristeza', peso: 0.9 },
          { emocion: 'pérdida', peso: 0.6 },
        ],
        momentos: [
          { resumen: 'la casa queda quieta', emocion: 'tristeza', intensidad: 0.7 },
          { resumen: 'sobra una silla', emocion: 'pérdida', intensidad: 0.8 },
          { resumen: 'la noche no cede', emocion: 'tristeza', intensidad: 0.5 },
        ],
      }),
    },
    {
      id: 'sint-calma',
      modo: 'calma',
      texto: largo,
      locale: 'es',
      analisis: analisisBase({
        animo: { valencia: 0.66, activacion: 0.22, dominancia: 0.48 },
        emociones: [
          { emocion: 'calma', peso: 0.85 },
          { emocion: 'gratitud', peso: 0.3 },
        ],
        momentos: [
          { resumen: 'el río va bajo', emocion: 'calma', intensidad: 0.2 },
          { resumen: 'no estaba triste', emocion: 'calma', intensidad: 0.25 },
          { resumen: 'vuelve sin apuro', emocion: 'gratitud', intensidad: 0.3 },
        ],
      }),
    },
    {
      id: 'sint-poco',
      modo: 'poco',
      texto: 'El amor',
      locale: 'es',
      analisis: analisisBase({
        animo: { valencia: 0.8, activacion: 0.4, dominancia: 0.5 },
        emociones: [{ emocion: 'amor', peso: 0.9 }],
        momentos: [{ resumen: 'El amor', emocion: 'amor', intensidad: 0.4 }],
        palabrasClave: [{ palabra: 'amor', peso: 1 }],
      }),
    },
  ];

  const dir = resolve('tmp-cintas-v2/comprobar');
  await mkdir(dir, { recursive: true });
  const stats: string[] = [];
  for (const caso of modos) {
    const a = componerCintas({ id: caso.id, analisis: caso.analisis, texto: caso.texto, locale: caso.locale });
    const b = componerCintas({ id: caso.id, analisis: caso.analisis, texto: caso.texto, locale: caso.locale });
    decir(JSON.stringify(a) === JSON.stringify(b), `${caso.id} determinista`);
    decir(a.modo === caso.modo, `${caso.id} modo ${a.modo}, se esperaba ${caso.modo}`);
    const ancho = a.bandas.reduce((s, x) => s + x.ancho, 0);
    decir(ancho === 1080 && a.bandas.every((x) => x.ancho > 0), `${caso.id} suma ${ancho}`);
    decir(!repetida(a.bandas.map((x) => x.ancho)), `${caso.id} no repite la secuencia`);
    decir(
      a.bandas.every((x) => x.hex !== '#000000' && hexRgb(x.hex).reduce((s, n) => s + n, 0) > 40),
      `${caso.id} sin negro`
    );
    const crema = a.bandas.filter((x) => x.hex === '#F2EAD8').reduce((s, x) => s + x.ancho, 0);
    const campos = a.bandas.filter((x) => x.clase === 'campo');
    stats.push(`${caso.id} bandas=${a.bandas.length} crema=${crema} campos=${campos.length} maxCampo=${Math.max(0, ...campos.map((c) => c.ancho))}`);
    const pngModo = await pngV2(a.bandas, {
      titulo: caso.id,
      ciudad: 'Puebla',
      pais: 'México',
      at: FECHA_PIE,
      locale: 'es',
    });
    await writeFile(join(dir, `${caso.id}.png`), pngModo);
  }
  for (const linea of stats) console.log(linea);

  const intensa = modos[0]!;
  const calma = modos[2]!;
  const planI = componerCintas({ id: intensa.id, analisis: intensa.analisis, texto: intensa.texto, locale: 'es' });
  const planC = componerCintas({ id: calma.id, analisis: calma.analisis, texto: calma.texto, locale: 'es' });
  const cremaI = planI.bandas.filter((x) => x.hex === '#F2EAD8').reduce((s, x) => s + x.ancho, 0);
  const cremaC = planC.bandas.filter((x) => x.hex === '#F2EAD8').reduce((s, x) => s + x.ancho, 0);
  decir(cremaC > cremaI + 80, `calma tiene más crema (${cremaC}) que intensa (${cremaI})`);
  const planT = componerCintas({
    id: 'sint-triste',
    analisis: modos[1]!.analisis,
    texto: largo,
    locale: 'es',
  });
  const maxCampo = Math.max(...planT.bandas.filter((x) => x.clase === 'campo').map((x) => x.ancho));
  decir(maxCampo >= Math.round(1080 * 0.25), `triste tiene un campo grande (${maxCampo})`);
  const planP = componerCintas({
    id: 'sint-poco',
    analisis: modos[3]!.analisis,
    texto: 'El amor',
    locale: 'es',
  });
  decir(planP.bandas.length < planI.bandas.length, `poco tiene menos franjas (${planP.bandas.length}) que intensa (${planI.bandas.length})`);

  for (const caso of CASOS_TEXTO) {
    const hits = hitsFromText(caso.texto, caso.locale).reduce((s, h) => s + h.count, 0);
    const tokens = caso.texto.trim().split(/\s+/).filter((w) => w.length > 1).length;
    const poco = esPocoContenido(caso.texto, caso.locale);
    if (caso.grupo === 'inventada') decir(!poco, `${caso.id} no es poco contenido (hits ${hits}/${tokens})`);
  }
  decir(esPocoContenido('El amor', 'es'), 'previo amor es poco contenido');
  decir(esPocoContenido(CASOS_TEXTO.find((c) => c.id === 'previo-sin-diccionario')!.texto, 'es'), 'previo sin diccionario es poco contenido');

  if (fallos.length) {
    console.error(`Comprobación con ${fallos.length} fallos.`);
    process.exit(1);
  }
  console.log('Comprobación lista.');
}

async function correr(opciones: { modelo: string; soloAnalisis: boolean }): Promise<void> {
  config({ path: resolve('.env.local') });
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  if (!apiKey) {
    console.error('Falta OPENAI_API_KEY en .env.local, en la raíz del repo.');
    console.error('Agrega una línea nueva: OPENAI_API_KEY=tu_clave');
    console.error('No la pegues en el chat. Avisa cuando el archivo esté guardado.');
    process.exit(2);
  }

  const carpeta = opciones.soloAnalisis
    ? join(SALIDA, 'comparacion', opciones.modelo)
    : SALIDA;
  await mkdir(join(carpeta, 'analisis'), { recursive: true });
  if (!opciones.soloAnalisis) {
    await mkdir(join(SALIDA, 'piezas'), { recursive: true });
    await mkdir(join(SALIDA, 'por-caso'), { recursive: true });
  }

  const costos: Array<Record<string, unknown>> = [];
  const piezasV2: Array<{ titulo: string; modo: string; png: Buffer }> = [];
  let total = 0;

  for (const caso of CASOS_TEXTO) {
    const resultado = await comprenderRelato({
      texto: caso.texto,
      locale: caso.locale,
      apiKey,
      modelo: opciones.modelo,
    });
    const plan = componerCintas({
      id: caso.id,
      analisis: resultado.analisis,
      texto: caso.texto,
      locale: caso.locale,
    });
    if (!opciones.soloAnalisis) {
      const pie = pieDe(caso);
      const actual = await pngActual({ id: caso.id, texto: caso.texto, pie });
      const v2 = await pngV2(plan.bandas, pie);
      const resumen = resumenAnalisis(resultado.analisis, plan.modo, resultado.origen, resultado.detalle);
      const hoja = await hojaPorCaso({ titulo: caso.titulo, actual, v2, resumen });
      await writeFile(join(SALIDA, 'piezas', `${caso.id}-actual.png`), actual);
      await writeFile(join(SALIDA, 'piezas', `${caso.id}-v2.png`), v2);
      await writeFile(join(SALIDA, 'por-caso', `${caso.id}.png`), hoja);
      piezasV2.push({ titulo: caso.titulo, modo: plan.modo, png: v2 });
    }
    await writeFile(
      join(carpeta, 'analisis', `${caso.id}.json`),
      JSON.stringify(
        {
          id: caso.id,
          titulo: caso.titulo,
          origen: resultado.origen,
          detalle: resultado.detalle,
          reintentos: resultado.reintentos,
          modo: plan.modo,
          analisis: resultado.analisis,
          bandas: plan.bandas,
        },
        null,
        2
      )
    );
    const fila = {
      id: caso.id,
      minutosTranscritos: 0,
      tokensEntrada: resultado.tokensEntrada,
      tokensSalida: resultado.tokensSalida,
      costoUsd: Number(resultado.costoUsd.toFixed(6)),
      origen: resultado.origen,
      reintentos: resultado.reintentos,
      detalle: resultado.detalle,
    };
    costos.push(fila);
    total += resultado.costoUsd;
    console.log(`${caso.id}: ${resultado.origen} ${resultado.costoUsd.toFixed(6)} USD`);
  }

  if (!opciones.soloAnalisis) {
    const todas = await hojaTodas(piezasV2);
    await writeFile(join(SALIDA, 'todas-v2.png'), todas);
  }
  const precio = PRECIOS_LENGUAJE[opciones.modelo] ?? {
    entrada: PRECIO_ENTRADA_POR_MILLON,
    salida: PRECIO_SALIDA_POR_MILLON,
  };
  const informe = {
    modelo: opciones.modelo,
    preciosUsd: {
      entradaPorMillon: precio.entrada,
      salidaPorMillon: precio.salida,
    },
    casos: costos,
    totalUsd: Number(total.toFixed(6)),
    respaldo: costos.filter((c) => c.origen !== 'modelo').map((c) => c.id),
  };
  await writeFile(join(carpeta, 'costos.json'), JSON.stringify(informe, null, 2));
  console.log(`Total ${informe.totalUsd.toFixed(6)} USD`);
  console.log(`Salida ${carpeta}`);
  if (!opciones.soloAnalisis) {
    const abrir = spawn('open', [SALIDA], { stdio: 'ignore', detached: true });
    abrir.unref();
  }
}

function valorArg(nombre: string): string | null {
  const i = process.argv.indexOf(nombre);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

const tarea =
  process.argv[2] === '--comprobar'
    ? comprobar()
    : correr({
        modelo: valorArg('--modelo') ?? MODELO_LENGUAJE,
        soloAnalisis: process.argv.includes('--solo-analisis'),
      });
tarea.catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error';
  console.error(mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***'));
  process.exit(1);
});
