/** Paleta propia: 16 empolvados y 4 acentos. Sin negro. */

export const CREMA = '#F2EAD8';
export const FONDO = '#F7F4EE';
export const TINTA_PIE = '#8A8A7A';

export const EMPOLVADOS = [
  '#F0D2C4',
  '#E6D3B4',
  '#D4B483',
  '#E0B08A',
  '#D9A3A0',
  '#C4846A',
  '#B7C4A4',
  '#8E9A78',
  '#E7DDD0',
  '#C5D0D6',
  '#8AA0AE',
  '#6E8CA6',
  '#2C3E7A',
  '#6B3F6E',
  '#8C5A78',
  '#5E6E82',
] as const;

export const ACENTOS = ['#E15A45', '#E39A2D', '#C4376C', '#2F8F8A'] as const;

export const PALETA = [...EMPOLVADOS, ...ACENTOS] as const;

export const EMOCIONES = [
  'nostalgia',
  'alegría',
  'tristeza',
  'esperanza',
  'amor',
  'miedo',
  'rabia',
  'calma',
  'orgullo',
  'gratitud',
  'pérdida',
  'asombro',
] as const;

export type Emocion = (typeof EMOCIONES)[number];

type Par = { clara: string; profunda: string; acento: string };

const POR_EMOCION: Record<Emocion, Par> = {
  nostalgia: { clara: '#D4B483', profunda: '#C4846A', acento: '#E39A2D' },
  alegría: { clara: '#F0D2C4', profunda: '#E0B08A', acento: '#E39A2D' },
  tristeza: { clara: '#8AA0AE', profunda: '#2C3E7A', acento: '#6E8CA6' },
  esperanza: { clara: '#B7C4A4', profunda: '#8E9A78', acento: '#2F8F8A' },
  amor: { clara: '#D9A3A0', profunda: '#8C5A78', acento: '#C4376C' },
  miedo: { clara: '#5E6E82', profunda: '#2C3E7A', acento: '#5E6E82' },
  rabia: { clara: '#C4846A', profunda: '#6B3F6E', acento: '#E15A45' },
  calma: { clara: '#E7DDD0', profunda: '#B7C4A4', acento: '#8E9A78' },
  orgullo: { clara: '#D4B483', profunda: '#C4846A', acento: '#E39A2D' },
  gratitud: { clara: '#E6D3B4', profunda: '#D4B483', acento: '#E39A2D' },
  pérdida: { clara: '#8C5A78', profunda: '#6B3F6E', acento: '#6B3F6E' },
  asombro: { clara: '#C5D0D6', profunda: '#6E8CA6', acento: '#2F8F8A' },
};

const CALIDOS = ['#F0D2C4', '#E6D3B4', '#D4B483', '#E0B08A', '#D9A3A0', '#C4846A', '#E7DDD0', '#B7C4A4'];
const FRIOS = ['#C5D0D6', '#8AA0AE', '#6E8CA6', '#2C3E7A', '#6B3F6E', '#8C5A78', '#5E6E82', '#8E9A78'];

export function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const n = Number.parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function luminancia(hex: string): number {
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function dist2(a: string, b: string): number {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const dr = A[0] - B[0];
  const dg = A[1] - B[1];
  const db = A[2] - B[2];
  return dr * dr + dg * dg + db * db;
}

export function tonoMasCercano(hex: string): string {
  let best: string = PALETA[0];
  let score = Number.POSITIVE_INFINITY;
  for (const tono of PALETA) {
    const d = dist2(hex, tono);
    if (d < score) {
      score = d;
      best = tono;
    }
  }
  return best;
}

/** Acerca el color real un 70 % al tono de paleta más cercano, sin pasar de lo más oscuro permitido. */
export function armonizar(hex: string): string {
  const cercano = tonoMasCercano(hex);
  const A = hexRgb(hex);
  const B = hexRgb(cercano);
  const mixto = rgbHex(A[0] * 0.3 + B[0] * 0.7, A[1] * 0.3 + B[1] * 0.7, A[2] * 0.3 + B[2] * 0.7);
  if (luminancia(mixto) + 0.5 < luminancia(cercano)) return cercano.toUpperCase();
  return mixto;
}

export function colorDeEmocion(
  emocion: Emocion,
  animo: { valencia: number; activacion: number },
  peso: number,
  rango: number
): string {
  const par = POR_EMOCION[emocion];
  const base = animo.valencia >= 0.5 ? par.clara : par.profunda;
  const viva = animo.activacion >= 0.66 && rango < 2 && peso >= 0.35;
  return (viva ? par.acento : base).toUpperCase();
}

export function colorDePalabra(palabra: string, valencia: number, activacion: number, peso: number): string {
  const familia = valencia >= 0.55 ? CALIDOS : valencia <= 0.42 ? FRIOS : EMPOLVADOS;
  let h = 0;
  for (let i = 0; i < palabra.length; i++) h = (h + palabra.charCodeAt(i) * (i + 1)) >>> 0;
  const base = familia[h % familia.length] ?? EMPOLVADOS[0];
  if (activacion >= 0.72 && peso >= 0.55) {
    return ACENTOS[h % ACENTOS.length]!.toUpperCase();
  }
  return base.toUpperCase();
}
