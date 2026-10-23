/**
 * El análisis es privado.
 * Solo compone las cintas y alimenta la curaduría en /admin.
 * Nunca se publica ni se muestra en el sitio.
 */
import { z } from 'zod';
import { TONOS_MADRE, type TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { EMOCIONES, type Emocion } from '@/lib/cintas-v2/palette';

export const IdiomaSchema = z.enum(['es', 'pt', 'en', 'otro']);
export type Idioma = z.infer<typeof IdiomaSchema>;

export const EmocionSchema = z.enum(EMOCIONES);

const peso = z.coerce.number().finite().min(0).max(1);

export const TonoImagenSchema = z.enum(TONOS_MADRE);
export const LuzImagenSchema = z.enum(['sube', 'baja']);

const BAJA_LUZ =
  /\b(atardecer|ocaso|anochecer|anochece|entardecer|dusk|sunset|penumbra|sombra|apaga\w*|noche|night)\b/i;
const SUBE_LUZ =
  /\b(amanecer|amanhecer|alba|mediod[ií]a|mañana|manana|manhã|morning|dawn|sunrise|sunlight|sunshine|sol|luces|luz|light|brilho?|glow|iluminad[oa]s?|ilumina)\b/i;

/** La luz, la hora y el brillo no son un tono. Suben o bajan la luminosidad. */
export function clasificarLuz(descripcion: string): 'sube' | 'baja' | null {
  if (BAJA_LUZ.test(descripcion)) return 'baja';
  if (SUBE_LUZ.test(descripcion)) return 'sube';
  return null;
}

const COLOR_DICHO: Array<[RegExp, TonoMadre]> = [
  [/\b(amarill\w*|dourad\w*|dorad\w*|yellow|golden)\b/i, 'amarillo'],
  [/\b(azules?|azul|blue|celestes?)\b/i, 'azul'],
  [/\b(rojos?|rojas?|red|granates?|carm[ií]n\w*)\b/i, 'rojo'],
  [/\b(verdes?|green)\b/i, 'verde'],
  [/\b(naranjas?|orange)\b/i, 'naranja'],
  [/\b(rosas?|rosad\w*|pink)\b/i, 'rosa'],
  [/\b(morad\w*|violet\w*|lilas?|purple)\b/i, 'morado'],
  [/\b(fucsias?|magenta)\b/i, 'magenta'],
  [/\b(color\s+t[eé]|t[eé]\s+claro)\b/i, 'amarillo'],
];

const COLOR_TIPICO: Array<[RegExp, TonoMadre]> = [
  [/\b(ma[ií]z|milho)\b/i, 'amarillo'],
  [/\b(lim[oó]n(?:es)?|lim[aã]o|lemons?)\b/i, 'lima'],
  [/\b(tomates?|tomatoes?)\b/i, 'rojo'],
  [/\b(sangre|blood)\b/i, 'rojo'],
  [/\b(pasto|grama|hierba|c[eé]sped|grass)\b/i, 'verde'],
  [/\b(cielos?|c[eé]u|skies|sky)\b/i, 'azul'],
  [/\b(mares?|mar|oc[eé]anos?|oceans?|sea)\b/i, 'calipso'],
];

const SIN_COLOR_TIPICO = /\b(nieve|neve|snow|blanc\w*|whites?|negr\w*|blacks?)\b/i;

/** Color dicho en la historia, o color típico universal. La nieve no cuenta. */
export function colorPropio(descripcion: string): TonoMadre | null {
  if (SIN_COLOR_TIPICO.test(descripcion)) return null;
  for (const [regla, tono] of COLOR_DICHO) {
    if (regla.test(descripcion)) return tono;
  }
  for (const [regla, tono] of COLOR_TIPICO) {
    if (regla.test(descripcion)) return tono;
  }
  return null;
}

export function esPaisajeDeFondo(descripcion: string): boolean {
  return /\b(jard[ií]n|gardens?|campo|fields?|vegeta(?:ci[oó]n|ção)|vegetacion|cielos?|c[eé]u|skies|sky|de fondo|al fondo|ao fundo|background)\b/i.test(descripcion);
}

export const ImagenMomentoSchema = z
  .object({
    descripcion: z
      .string()
      .trim()
      .min(1)
      .refine((s) => s.split(/\s+/).filter(Boolean).length <= 5, 'máximo 5 palabras'),
    tono: TonoImagenSchema.optional(),
    luz: LuzImagenSchema.optional(),
    importancia: peso.optional(),
    peso,
  })
  .refine((img) => !(img.tono && img.luz), 'la imagen no lleva tono y luz a la vez');

export type ImagenMomento = z.infer<typeof ImagenMomentoSchema>;

export const AnalisisSchema = z.object({
  animo: z.object({
    valencia: peso,
    activacion: peso,
    dominancia: peso,
  }),
  emociones: z
    .array(
      z.object({
        emocion: EmocionSchema,
        peso,
      })
    )
    .min(1)
    .max(12),
  momentos: z
    .array(
      z.object({
        resumen: z
          .string()
          .trim()
          .min(1)
          .refine((s) => s.split(/\s+/).filter(Boolean).length <= 8, 'máximo 8 palabras'),
        emocion: EmocionSchema,
        intensidad: peso,
        valencia: peso.optional(),
        imagenes: z.union([z.literal('sin imagen'), z.array(ImagenMomentoSchema).min(1).max(4)]).optional(),
      })
    )
    .min(1)
    .max(8),
  palabrasClave: z
    .array(
      z.object({
        palabra: z.string().trim().min(1).max(40),
        peso,
      })
    )
    .min(1)
    .max(8),
  idioma: IdiomaSchema,
  avisos: z.object({
    contenidoSensible: z.boolean(),
    violencia: z.boolean(),
    menores: z.boolean(),
  }),
});

export type Analisis = z.infer<typeof AnalisisSchema>;

const ALIAS: Record<string, Emocion> = {
  nostalgia: 'nostalgia',
  alegria: 'alegría',
  alegría: 'alegría',
  joy: 'alegría',
  tristeza: 'tristeza',
  sadness: 'tristeza',
  triste: 'tristeza',
  esperanza: 'esperanza',
  hope: 'esperanza',
  amor: 'amor',
  love: 'amor',
  miedo: 'miedo',
  fear: 'miedo',
  rabia: 'rabia',
  ira: 'rabia',
  anger: 'rabia',
  calma: 'calma',
  calm: 'calma',
  orgullo: 'orgullo',
  pride: 'orgullo',
  gratitud: 'gratitud',
  gratitude: 'gratitud',
  perdida: 'pérdida',
  pérdida: 'pérdida',
  loss: 'pérdida',
  asombro: 'asombro',
  wonder: 'asombro',
  awe: 'asombro',
};

function emocionDe(raw: unknown): Emocion | null {
  if (typeof raw !== 'string') return null;
  const key = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const directo = ALIAS[raw.trim().toLowerCase()] ?? ALIAS[key];
  return directo ?? null;
}

function num(raw: unknown, fallback = 0.5): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function flag(raw: unknown): boolean {
  if (raw === true || raw === 1 || raw === 'true' || raw === 'si' || raw === 'sí') return true;
  return false;
}

function ochoPalabras(raw: unknown): string {
  const texto = typeof raw === 'string' ? raw.trim() : '';
  return texto.split(/\s+/).filter(Boolean).slice(0, 8).join(' ');
}

function cincoPalabras(raw: unknown): string {
  const texto = typeof raw === 'string' ? raw.trim() : '';
  return texto.split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
}

const TONO_ALIAS: Record<string, TonoMadre> = {
  rojo: 'rojo',
  naranja: 'naranja',
  amarillo: 'amarillo',
  lima: 'lima',
  verde: 'verde',
  'verde azulado': 'verde azulado',
  verdeazulado: 'verde azulado',
  turquesa: 'calipso',
  calipso: 'calipso',
  azul: 'azul',
  'azul violeta': 'azul violeta',
  azulvioleta: 'azul violeta',
  violeta: 'morado',
  morado: 'morado',
  fucsia: 'magenta',
  magenta: 'magenta',
  rosa: 'rosa',
  rosado: 'rosa',
};

function tonoDe(raw: unknown): TonoMadre | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  return TONO_ALIAS[key] ?? null;
}

function imagenesDe(raw: unknown): 'sin imagen' | ImagenMomento[] {
  if (typeof raw === 'string' && raw.trim().toLowerCase().includes('sin imagen')) return 'sin imagen';
  if (!Array.isArray(raw)) return 'sin imagen';
  const out: ImagenMomento[] = [];
  for (const item of raw) {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const descripcion = cincoPalabras(row.descripcion ?? row.description ?? row.imagen);
    if (!descripcion) continue;
    const luzDicha = row.luz === 'sube' || row.luz === 'baja' ? row.luz : null;
    const luz = clasificarLuz(descripcion) ?? luzDicha;
    const pesoImagen = num(row.peso ?? row.weight, 0.5);
    const importancia = num(row.importancia ?? row.importance, pesoImagen);
    if (luz) {
      out.push({ descripcion, luz, peso: pesoImagen, importancia });
    } else {
      const propio = colorPropio(descripcion);
      if (!propio) {
        out.push({ descripcion, peso: pesoImagen, importancia });
      } else {
        const tope = esPaisajeDeFondo(descripcion) && importancia < 0.8 ? Math.min(importancia, 0.4) : importancia;
        out.push({ descripcion, tono: propio, peso: pesoImagen, importancia: tope });
      }
    }
    if (out.length === 4) break;
  }
  return out.length > 0 ? out : 'sin imagen';
}

function idiomaDe(raw: unknown): string {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (v.startsWith('es') || v.includes('spanish') || v.includes('español')) return 'es';
  if (v.startsWith('pt') || v.includes('portug')) return 'pt';
  if (v.startsWith('en') || v.includes('english') || v.includes('ingl')) return 'en';
  if (v === 'otro' || v === 'other') return 'otro';
  return v || 'otro';
}

function listaEmociones(raw: unknown): Array<{ emocion: Emocion; peso: number }> {
  const out: Array<{ emocion: Emocion; peso: number }> = [];
  const push = (emocion: Emocion | null, pesoRaw: unknown) => {
    if (!emocion) return;
    if (out.some((e) => e.emocion === emocion)) return;
    out.push({ emocion, peso: num(pesoRaw, 0.4) });
  };
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>;
        push(emocionDe(row.emocion ?? row.emotion ?? row.nombre), row.peso ?? row.weight ?? row.valor);
      } else {
        push(emocionDe(item), 0.4);
      }
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) push(emocionDe(k), v);
  }
  return out.slice(0, 12);
}

/** Acomoda la respuesta del modelo antes de validarla. */
export function normalizarAnalisis(raw: unknown): unknown {
  const base = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const animoRaw = (base.animo ?? base.mood ?? base.animoGeneral ?? {}) as Record<string, unknown>;
  const avisosRaw = (base.avisos ?? base.flags ?? {}) as Record<string, unknown>;
  const momentosRaw = Array.isArray(base.momentos) ? base.momentos : Array.isArray(base.moments) ? base.moments : [];
  const clavesRaw = Array.isArray(base.palabrasClave)
    ? base.palabrasClave
    : Array.isArray(base.keywords)
      ? base.keywords
      : [];

  const momentos = momentosRaw
    .map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const emocion = emocionDe(row.emocion ?? row.emotion);
      const resumen = ochoPalabras(row.resumen ?? row.summary);
      if (!emocion || !resumen) return null;
      const valenciaRaw = row.valencia ?? row.valence;
      return {
        resumen,
        emocion,
        intensidad: num(row.intensidad ?? row.intensity, 0.5),
        ...(typeof valenciaRaw === 'number' || typeof valenciaRaw === 'string' ? { valencia: num(valenciaRaw, 0.5) } : {}),
        imagenes: imagenesDe(row.imagenes ?? row.images ?? row.imagen),
      };
    })
    .filter((x): x is { resumen: string; emocion: Emocion; intensidad: number; valencia?: number; imagenes: 'sin imagen' | ImagenMomento[] } => Boolean(x))
    .slice(0, 8);

  const palabrasClave = clavesRaw
    .map((item) => {
      const row: Record<string, unknown> =
        item && typeof item === 'object' ? (item as Record<string, unknown>) : { palabra: item };
      const palabra = typeof row.palabra === 'string' ? row.palabra.trim() : typeof row.word === 'string' ? row.word.trim() : '';
      if (!palabra) return null;
      return { palabra: palabra.slice(0, 40), peso: num(row.peso ?? row.weight, 0.4) };
    })
    .filter((x): x is { palabra: string; peso: number } => Boolean(x))
    .slice(0, 8);

  return {
    animo: {
      valencia: num(animoRaw.valencia ?? animoRaw.valence, 0.5),
      activacion: num(animoRaw.activacion ?? animoRaw.arousal ?? animoRaw.activation, 0.5),
      dominancia: num(animoRaw.dominancia ?? animoRaw.dominance, 0.5),
    },
    emociones: listaEmociones(base.emociones ?? base.emotions),
    momentos,
    palabrasClave,
    idioma: idiomaDe(base.idioma ?? base.language),
    avisos: {
      contenidoSensible: flag(avisosRaw.contenidoSensible ?? avisosRaw.sensible),
      violencia: flag(avisosRaw.violencia ?? avisosRaw.violence),
      menores: flag(avisosRaw.menores ?? avisosRaw.minors),
    },
  };
}

export function relatoTieneLuz(analisis: Analisis): boolean {
  return analisis.momentos.some((momento) => {
    if (!Array.isArray(momento.imagenes)) return false;
    return momento.imagenes.some((img) => img.luz || clasificarLuz(img.descripcion));
  });
}

export function erroresDe(error: { issues?: Array<{ path?: PropertyKey[]; message: string }> }): string {
  const issues = error.issues ?? [];
  if (issues.length === 0) return 'respuesta inválida';
  return issues
    .slice(0, 8)
    .map((i) => `${(i.path ?? []).join('.')}: ${i.message}`)
    .join('; ');
}
