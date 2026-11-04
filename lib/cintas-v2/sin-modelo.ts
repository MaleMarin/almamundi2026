/**
 * Cintas estilo Gene Davis (metodología final, ronda 10) sin llamar a ningún modelo.
 *
 * - La emoción (luz e intensidad) sale del léxico AlmaMundi. El final del relato pesa el doble.
 * - El color propio sale de lo que dice el relato ("cocina amarilla", "mar", "limón").
 * - En fotos, los colores medidos de la imagen pueden ser protagonistas.
 * - Si no hay señal, la semilla de la historia elige entre las 36 paletas de respaldo.
 *
 * Costo: 0. Funciona igual en el navegador y en el servidor.
 */
import type { AlmaLocale } from '@/lib/i18n/locale';
import { componerCintas } from '@/lib/cintas-v2/compose/layout';
import { colorearV9 } from '@/lib/cintas-v2/compose/color-v9';
import { tonoCercano } from '@/lib/cintas-v2/compose/color-v3';
import { analisisDesdeDiccionario } from '@/lib/cintas-v2/understand/lexicon-fallback';
import { hitsFromText } from '@/lib/huella/almamundi-lexicon';
import { clasificarLuz, colorPropio, type Analisis, type ImagenMomento } from '@/lib/cintas-v2/understand/schema';
import { hashString } from '@/lib/cintas-v2/seed';
import type { TonoMadre } from '@/lib/cintas-v2/paleta-madre';

export type FranjaCinta = { hex: string; width: number };

const NIVELES = [0.2, 0.5, 0.8];

/** Trozos de hasta cinco palabras donde aparece un color propio o una palabra de luz. */
function imagenesDeFrase(frase: string): ImagenMomento[] {
  const palabras = frase.split(/\s+/).filter(Boolean);
  const out: ImagenMomento[] = [];
  const tonos = new Set<TonoMadre>();
  for (let i = 0; i < palabras.length && out.length < 4; i++) {
    const trozo = palabras.slice(Math.max(0, i - 2), i + 3).join(' ');
    const luz = clasificarLuz(palabras[i]!);
    if (luz) {
      out.push({ descripcion: trozo, luz, peso: 0.4, importancia: 0.4 });
      continue;
    }
    const tono = colorPropio(palabras.slice(i, i + 3).join(' '));
    if (!tono || tonos.has(tono)) continue;
    tonos.add(tono);
    const descripcion = palabras.slice(i, i + 3).join(' ');
    if (colorPropio(descripcion) !== tono) continue;
    out.push({ descripcion, tono, peso: 0.6, importancia: 0.6 });
  }
  return out;
}

function conImagenes(analisis: Analisis, texto: string): Analisis {
  const frases = texto
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const imagenes = frases.map(imagenesDeFrase);
  const usadas = new Set<number>();
  const momentos = analisis.momentos.map((momento, i) => {
    const encontrada = frases.findIndex((f, k) => !usadas.has(k) && momento.resumen && f.startsWith(momento.resumen.split(' ')[0] ?? ''));
    const k = encontrada >= 0 && frases[encontrada]!.includes(momento.resumen) ? encontrada : i;
    usadas.add(k);
    const propias = imagenes[k] ?? [];
    return propias.length > 0 ? { ...momento, imagenes: propias.slice(0, 4) } : momento;
  });
  // Colores dichos en frases cortas (título, contexto) que no formaron momento propio.
  const sobrantes = imagenes.filter((_, k) => !usadas.has(k)).flat().filter((img) => img.tono);
  if (sobrantes.length > 0 && momentos.length > 0) {
    const primero = momentos[0]!;
    const previas = Array.isArray(primero.imagenes) ? primero.imagenes : [];
    momentos[0] = { ...primero, imagenes: [...previas, ...sobrantes].slice(0, 4) };
  }
  return { ...analisis, momentos };
}

const PESO_TERCIOS = [1, 1.5, 2];

/**
 * Expresiones de pérdida y ausencia que el diccionario palabra por palabra no ve
 * (incluye modismos de Chile y México). Cada una cuenta como una palabra de valencia baja.
 */
const PERDIDA: RegExp[] = [
  /\bbot(?:ar|ó|é|aron|ándola|ándolo|ada|ado)\b/i,
  /\btir(?:ó|aron|ándola|ándolo)\b/i,
  /\bnunca (?:fui|volví|volvió|más|supe|le dije|pude)\b/i,
  /\bya no (?:está|estaba|están|existe|volvió|volví)\b/i,
  /\b(?:me|nos) dio (?:lata|pena|tristeza)\b/i,
  /\bse (?:fue|murió|perdió|apagó|terminó)\b/i,
  /\bdesarm(?:amos|aron|ar) la casa\b/i,
  /\b(?:falleci[óo]|murió|partió|despedimos|extraño|extrañé|echo de menos)\b/i,
  /\b(?:no alcancé|demasiado tarde|nunca más)\b/i,
  /\b(?:nunca mais|já não|sinto falta|faleceu)\b/i,
  /\b(?:passed away|never went back|threw (?:it )?away|i miss)\b/i,
];
const HIT_PERDIDA = { v: 0.18, a: 0.32, d: 0.3 };

/** Frases de al menos tres palabras, en orden. */
function frasesDe(texto: string): string[] {
  return texto
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 3);
}

/**
 * Ajuste del 4 nov 2026: el final del relato pesa más al elegir la luz y la intensidad.
 * Las historias suelen cerrar con su sentido; el diccionario solo, palabra por palabra, no lo ve.
 * - Ánimo: las palabras del primer tercio pesan 1, las del segundo 1,5 y las del último 2.
 * - Expresiones de pérdida y ausencia («nunca fui a buscarla», «terminó botándola») cuentan como palabras tristes.
 * - Momentos: si hay más de 8 frases, se eligen repartidas de principio a fin, incluida la última.
 */
function conFinalConPeso(analisis: Analisis, texto: string, locale: AlmaLocale): Analisis {
  const frases = frasesDe(texto);
  if (frases.length < 3) return analisis;

  let v = 0;
  let a = 0;
  let d = 0;
  let total = 0;
  frases.forEach((frase, i) => {
    const peso = PESO_TERCIOS[Math.min(2, Math.floor((i * 3) / frases.length))]!;
    for (const regla of PERDIDA) {
      if (!regla.test(frase)) continue;
      v += HIT_PERDIDA.v * peso;
      a += HIT_PERDIDA.a * peso;
      d += HIT_PERDIDA.d * peso;
      total += peso;
    }
    for (const hit of hitsFromText(frase, locale)) {
      const p = peso * hit.count;
      v += hit.v * p;
      a += hit.a * p;
      d += hit.d * p;
      total += p;
    }
  });
  const animo = total > 0 ? { valencia: v / total, activacion: a / total, dominancia: d / total } : analisis.animo;

  if (frases.length <= 8) return { ...analisis, animo };
  const elegidas = Array.from({ length: 8 }, (_, i) => frases[Math.round((i * (frases.length - 1)) / 7)]!);
  const momentos = elegidas.map((frase) => {
    const propio = analisisDesdeDiccionario(frase, locale);
    const principal = propio.idioma === 'otro' ? analisis.emociones[0]! : propio.emociones[0]!;
    return {
      resumen: frase.split(/\s+/).filter(Boolean).slice(0, 8).join(' '),
      emocion: principal.emocion,
      intensidad: propio.idioma === 'otro' ? analisis.animo.activacion : propio.animo.activacion,
    };
  });
  return { ...analisis, animo, momentos };
}

/**
 * Ajuste del 4 nov 2026: escala del diccionario → escala del modelo.
 * Las reglas de la ronda 10 (tercios de luz e intensidad, modos triste, calma e intensa) se calibraron
 * con las lecturas del modelo, que usan todo el rango de 0 a 1. El diccionario promedia palabras y
 * casi siempre queda entre 0,40 y 0,66 de valencia y entre 0,30 y 0,60 de activación, así que todas
 * las historias caían en la casilla del medio. Se estira ese rango al de 0 a 1.
 */
const VALENCIA_DICCIONARIO = { baja: 0.4, alta: 0.66 };
const ACTIVACION_DICCIONARIO = { baja: 0.3, alta: 0.6 };

function estirar(valor: number, rango: { baja: number; alta: number }): number {
  return Math.max(0, Math.min(1, (valor - rango.baja) / (rango.alta - rango.baja)));
}

function aEscalaModelo(analisis: Analisis): Analisis {
  return {
    ...analisis,
    animo: {
      ...analisis.animo,
      valencia: estirar(analisis.animo.valencia, VALENCIA_DICCIONARIO),
      activacion: estirar(analisis.animo.activacion, ACTIVACION_DICCIONARIO),
    },
    momentos: analisis.momentos.map((m) => ({ ...m, intensidad: estirar(m.intensidad, ACTIVACION_DICCIONARIO) })),
  };
}

/** Sin señal emocional: la semilla elige una de las 9 casillas, y así una de las 36 paletas. */
function casillaPorSemilla(analisis: Analisis, id: string): Analisis {
  const h = hashString(`${id}:casilla`);
  return {
    ...analisis,
    animo: { ...analisis.animo, valencia: NIVELES[h % 3]!, activacion: NIVELES[Math.floor(h / 3) % 3]! },
  };
}

export function cintasSinModelo(params: {
  id: string;
  texto: string;
  locale: AlmaLocale;
  /** Colores medidos de la foto (hex), del más presente al menos presente. */
  coloresImagen?: string[];
}): FranjaCinta[] {
  const texto = params.texto.trim();
  let analisis = conImagenes(conFinalConPeso(analisisDesdeDiccionario(texto, params.locale), texto, params.locale), texto);
  const sinPalabras = analisis.idioma === 'otro';
  const colores = (params.coloresImagen ?? []).filter((hex) => /^#[0-9a-f]{6}$/i.test(hex)).slice(0, 5);
  analisis = sinPalabras ? casillaPorSemilla(analisis, params.id) : aEscalaModelo(analisis);

  // La composición se revisa con las reglas de la ronda 10. Si una variante no cumple,
  // se prueba otra trazada desde la misma historia; la última se acepta igual para no dejar a nadie sin cinta.
  const intentos = 6;
  let plan: ReturnType<typeof componerCintas> | null = null;
  for (let i = 0; i < intentos && !plan; i++) {
    try {
      plan = componerCintas({
        id: i === 0 ? params.id : `${params.id}:${i}`,
        analisis,
        texto,
        locale: params.locale,
        silencios: [],
        duracionSegundos: 0,
        coloresImagen: colores.length > 0 ? colores : undefined,
        soloGeometria: true,
        tolerante: i === intentos - 1,
      });
    } catch {
      plan = null;
    }
  }
  if (!plan) return [];

  const tonosFoto = colores.slice(0, 3).map((hex) => tonoCercano(hex));
  const coloresPorMomento: TonoMadre[][] = analisis.momentos.map((momento) => {
    if (tonosFoto.length === 0) return [];
    const tieneColor = Array.isArray(momento.imagenes) && momento.imagenes.some((img) => img.tono);
    return tieneColor ? [] : tonosFoto;
  });

  let v9: ReturnType<typeof colorearV9>;
  try {
    v9 = colorearV9({ id: params.id, analisis, plan, coloresPorMomento });
  } catch {
    return [];
  }
  return v9.plan.bandas
    .filter((banda) => banda.ancho > 0)
    .map((banda) => ({ hex: banda.hex, width: banda.ancho }));
}

/** Texto que lee la cinta: título, contexto, relato o transcripción, y fichas de las fotos. */
export function textoParaCintas(params: {
  storyTitle?: string;
  context?: string;
  textBody?: string;
  photoFichas?: Array<{ nombre?: string; lugar?: string; alt?: string }>;
}): string {
  const fichas = (params.photoFichas ?? []).map((f) => [f.nombre, f.lugar, f.alt].filter(Boolean).join('. '));
  const partes = [params.storyTitle, params.context, params.textBody, ...fichas]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  const vistas = new Set<string>();
  return partes.filter((p) => (vistas.has(p) ? false : (vistas.add(p), true))).join('.\n');
}
