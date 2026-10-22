/** Paleta intensa, familias por emoción. Sin negro. El silencio es crema. */

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

export const CREMA = '#F7F1E3';
export const FONDO = '#F7F4EE';
export const TINTA_PIE = '#8A8A7A';

export const FAMILIA: Record<Emocion, readonly string[]> = {
  alegría: ['#FFD60A', '#FF7A00', '#FF4F5A', '#FF6FB5'],
  amor: ['#D90429', '#E0218A', '#FF5DA2'],
  calma: ['#7DD3FC', '#6EE7B7', '#22D3EE', '#C4B5FD'],
  esperanza: ['#9BE15D', '#10B981', '#FDE047'],
  nostalgia: ['#F59E0B', '#E76F51', '#C084FC', '#0E7490'],
  tristeza: ['#1D4ED8', '#3730A3', '#1E2A5E', '#7C3AED', '#6B3F6E'],
  pérdida: ['#1D4ED8', '#3730A3', '#1E2A5E', '#7C3AED', '#6B3F6E'],
  asombro: ['#00B4D8', '#2563EB', '#C026D3'],
  rabia: ['#E63946', '#D62828', '#8B5CF6', '#5B2A86'],
  miedo: ['#E63946', '#D62828', '#8B5CF6', '#5B2A86'],
  orgullo: ['#FFD60A', '#FF7A00', '#F59E0B', '#E0218A'],
  gratitud: ['#FDE047', '#9BE15D', '#FF6FB5', '#6EE7B7'],
};

/** Los más saturados. Toda historia usa al menos tres, también en calma. */
export const INTENSOS = [
  '#FFD60A',
  '#FF7A00',
  '#FF4F5A',
  '#FF6FB5',
  '#D90429',
  '#E0218A',
  '#FF5DA2',
  '#22D3EE',
  '#FDE047',
  '#9BE15D',
  '#F59E0B',
  '#E76F51',
  '#C084FC',
  '#00B4D8',
  '#C026D3',
  '#E63946',
  '#D62828',
  '#8B5CF6',
] as const;

const INTENSO = new Set<string>(INTENSOS);

function unicos(colores: readonly string[]): string[] {
  const out: string[] = [];
  for (const color of colores) {
    const hex = color.toUpperCase();
    if (!out.includes(hex)) out.push(hex);
  }
  return out;
}

export const PALETA = unicos(Object.values(FAMILIA).flat());

export function esIntenso(hex: string): boolean {
  return INTENSO.has(hex.toUpperCase());
}

/** Familias de calma y esperanza: celestes, mentas, aguas, lavandas y limas suaves. */
export const SUAVES = unicos([...FAMILIA.calma, ...FAMILIA.esperanza]);
const SUAVE = new Set<string>(SUAVES);

export function esSuave(hex: string): boolean {
  const h = hex.toUpperCase();
  if (h === CREMA) return false;
  if (SUAVE.has(h)) return true;
  return SUAVE.has(tonoMasCercano(h));
}

/** Intenso de otra familia. En calma solo puede ser un acento. */
export function esAcentoIntenso(hex: string): boolean {
  const h = hex.toUpperCase();
  if (!h || h === CREMA || esSuave(h)) return false;
  return esIntenso(h) || esIntenso(tonoMasCercano(h));
}

/** Entre 7 y 11 colores de la historia, con al menos 3 intensos. La crema va aparte. En calma manda la familia suave. */
export function coloresDeHistoria(emociones: Emocion[], rng: () => number, modo?: string): string[] {
  if (modo === 'calma') return coloresDeCalma(emociones);
  const vistos: string[] = [];
  const add = (hex: string) => {
    const h = hex.toUpperCase();
    if (!vistos.includes(h) && h !== CREMA && h !== '#000000') vistos.push(h);
  };
  for (const emocion of emociones) {
    for (const color of FAMILIA[emocion] ?? []) add(color);
  }
  const intensos = [...INTENSOS];
  for (let i = intensos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = intensos[i]!;
    intensos[i] = intensos[j]!;
    intensos[j] = tmp;
  }
  for (const color of intensos) {
    if (vistos.filter((hex) => esIntenso(hex)).length >= 3 && vistos.length >= 7) break;
    add(color);
  }
  if (vistos.length <= 11) return vistos;
  const out: string[] = [];
  for (const color of vistos) {
    if (out.filter((hex) => esIntenso(hex)).length >= 3) break;
    if (esIntenso(color)) out.push(color);
  }
  for (const emocion of emociones) {
    if (out.length >= 11) break;
    const color = FAMILIA[emocion]?.[0]?.toUpperCase();
    if (color && !out.includes(color)) out.push(color);
  }
  for (const color of vistos) {
    if (out.length >= 11) break;
    if (!out.includes(color)) out.push(color);
  }
  return out;
}

function coloresDeCalma(emociones: Emocion[]): string[] {
  const suaves = unicos([...FAMILIA.calma, ...FAMILIA.esperanza]);
  const out = [...suaves];
  for (const emocion of emociones) {
    if (emocion === 'calma' || emocion === 'esperanza') continue;
    for (const color of FAMILIA[emocion] ?? []) {
      const hex = color.toUpperCase();
      if (out.includes(hex) || !esIntenso(hex)) continue;
      if (out.length >= 11 || out.length - suaves.length >= 4) return out;
      out.push(hex);
    }
  }
  return out;
}

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
  let best: string = PALETA[0] ?? '#FF4F5A';
  let score = Number.POSITIVE_INFINITY;
  for (const tono of PALETA) {
    const d = dist2(hex, tono);
    if (d < score) {
      score = d;
      best = tono;
    }
  }
  return best.toUpperCase();
}

/** Acerca el color real un 70 % al tono de paleta más cercano, sin pasar de lo más oscuro permitido. */
export function armonizar(hex: string): string {
  const cercano = tonoMasCercano(hex);
  const A = hexRgb(hex);
  const B = hexRgb(cercano);
  const mixto = rgbHex(A[0] * 0.3 + B[0] * 0.7, A[1] * 0.3 + B[1] * 0.7, A[2] * 0.3 + B[2] * 0.7);
  if (luminancia(mixto) + 0.5 < luminancia(cercano)) return cercano;
  return mixto;
}

export function contrastan(a: string, b: string): boolean {
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  if (!A || !B || A === B) return false;
  const distancia = Math.sqrt(dist2(A, B));
  const luz = Math.abs(luminancia(A) - luminancia(B));
  if (A === CREMA || B === CREMA) return luz >= 26 || distancia >= 70;
  return distancia >= 68 || luz >= 42;
}

export function colorDeEmocion(
  emocion: Emocion,
  _animo: { valencia: number; activacion: number },
  _peso: number,
  rango: number
): string {
  const familia = FAMILIA[emocion];
  return (familia[Math.abs(rango) % familia.length] ?? familia[0]).toUpperCase();
}

export function colorDePalabra(palabra: string, valencia: number, activacion: number, peso: number): string {
  const familia = valencia >= 0.55 ? FAMILIA.alegría : valencia <= 0.42 ? FAMILIA.tristeza : FAMILIA.nostalgia;
  let h = 0;
  for (let i = 0; i < palabra.length; i++) h = (h + palabra.charCodeAt(i) * (i + 1)) >>> 0;
  if (activacion >= 0.72 && peso >= 0.55) {
    return INTENSOS[h % INTENSOS.length]!.toUpperCase();
  }
  return (familia[h % familia.length] ?? INTENSOS[0]).toUpperCase();
}
