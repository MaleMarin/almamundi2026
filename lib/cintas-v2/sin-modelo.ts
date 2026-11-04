/**
 * Cintas estilo Gene Davis (metodología final, ronda 10) sin llamar a ningún modelo.
 *
 * - La emoción (luz e intensidad) sale del léxico AlmaMundi.
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
  const momentos = analisis.momentos.map((momento, i) => {
    const propias = imagenes[i] ?? [];
    return propias.length > 0 ? { ...momento, imagenes: propias.slice(0, 4) } : momento;
  });
  // Colores dichos en frases cortas (título, contexto) que no formaron momento propio.
  const sobrantes = imagenes.slice(momentos.length).flat().filter((img) => img.tono);
  if (sobrantes.length > 0 && momentos.length > 0) {
    const primero = momentos[0]!;
    const previas = Array.isArray(primero.imagenes) ? primero.imagenes : [];
    momentos[0] = { ...primero, imagenes: [...previas, ...sobrantes].slice(0, 4) };
  }
  return { ...analisis, momentos };
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
  let analisis = conImagenes(analisisDesdeDiccionario(texto, params.locale), texto);
  const sinPalabras = analisis.idioma === 'otro';
  const colores = (params.coloresImagen ?? []).filter((hex) => /^#[0-9a-f]{6}$/i.test(hex)).slice(0, 5);
  if (sinPalabras) analisis = casillaPorSemilla(analisis, params.id);

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
