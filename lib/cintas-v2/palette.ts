/** Paleta intensa, familias por emoción. Sin blanco, negro, crema ni gris. */

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
  calma: ['#5EEAD4', '#6EE7B7', '#818CF8', '#C4B5FD', '#E9C46A', '#FFB4A2', '#A3D9A5', '#FBCFE8'],
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
  const h = hex.toUpperCase();
  if (INTENSO.has(h)) return true;
  const ajustado = ajustarTinta(h);
  for (const color of INTENSOS) {
    if (ajustarTinta(color) === ajustado) return true;
  }
  return false;
}

/** Familias de calma y esperanza: menta, verde agua, pervinca, lavanda y limas suaves. */
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

/** Entre 7 y 11 colores de las emociones presentes, con al menos 3 intensos. La crema va aparte. */
export function coloresDeHistoria(emociones: Emocion[], rng: () => number, _modo?: string): string[] {
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
    if (esCalipso(color) && !emociones.includes('asombro')) continue;
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

/** Luminosidad entre 22 % y 80 %, saturación de al menos 40 %. Conserva el tono. */
export function ajustarTinta(hex: string): string {
  const upper = hex.toUpperCase();
  let [h, s, l] = rgbAHsl(...hexRgb(upper));
  if (s < 0.08) {
    const cercano = tonoMasCercano(upper);
    [h, s, l] = rgbAHsl(...hexRgb(cercano));
  }
  if (s >= 0.4 && l >= 0.22 && l <= 0.8) return upper;
  s = Math.max(0.42, Math.min(1, s));
  l = Math.min(0.78, Math.max(0.24, l));
  let out = rgbHex(...hslARgb(h, s, l));
  if (!enRango(out)) out = rgbHex(...hslARgb(h, Math.max(0.46, s), Math.min(0.74, Math.max(0.28, l))));
  return out;
}

export function enRango(hex: string): boolean {
  const [, s, l] = rgbAHsl(...hexRgb(hex));
  return s >= 0.4 && l >= 0.22 && l <= 0.8;
}

export function medidaHsl(hex: string): { h: number; s: number; l: number } {
  const [h, s, l] = rgbAHsl(...hexRgb(hex));
  return { h, s, l };
}

/** Calipso, turquesa y celeste: matiz entre 180° y 205°. */
export function esCalipso(hex: string): boolean {
  const grados = medidaHsl(hex).h * 360;
  return grados >= 180 && grados <= 205;
}

/** Rojos, naranjas, amarillos y rosas. Ahí el silencio no puede quedar beige. */
export function esCalido(h: number): boolean {
  const grados = h * 360;
  return grados <= 70 || grados >= 320;
}

/** Si el color cae en calipso, lo corre justo fuera de esa franja y conserva la tinta. */
export function sinCalipso(hex: string): string {
  if (!esCalipso(hex)) return hex.toUpperCase();
  const { h, s, l } = medidaHsl(hex);
  const destino = h * 360 <= 192.5 ? 168 / 360 : 214 / 360;
  let out = ajustarTinta(rgbHex(...hslARgb(destino, Math.max(0.5, s), Math.min(0.74, Math.max(0.28, l)))));
  if (esCalipso(out)) out = ajustarTinta(rgbHex(...hslARgb(214 / 360, 0.6, 0.46)));
  return out;
}

/** Aclara el color del racimo: luminosidad 62–78 % y saturación 45–70 %, con el mismo tono. */
export function variarSilencio(hex: string, paso: number, prohibido = ''): string {
  const [h] = rgbAHsl(...hexRgb(hex));
  const calido = esCalido(h);
  const luces = [0.64, 0.68, 0.72, 0.76, 0.63, 0.7, 0.74, 0.77];
  const sats = calido ? [0.66, 0.68, 0.7, 0.67, 0.69, 0.65] : [0.48, 0.56, 0.64, 0.46, 0.6, 0.68, 0.52];
  const veto = prohibido.toUpperCase();
  const satMin = calido ? 0.65 : 0.45;
  for (let k = 0; k < luces.length * sats.length; k++) {
    const luz = luces[(paso + k) % luces.length]!;
    const sat = sats[(paso * 2 + k) % sats.length]!;
    const out = rgbHex(...hslARgb(h, sat, luz));
    if (out === veto) continue;
    const medida = medidaHsl(out);
    if (medida.l < 0.62 || medida.l > 0.78 || medida.s < satMin || medida.s > 0.7) continue;
    if (!enRango(out)) continue;
    return out;
  }
  return rgbHex(...hslARgb(h, calido ? 0.68 : 0.55, 0.7));
}

/** Misma tinta, más oscura, para que el silencio claro tenga con qué contrastar. */
export function oscurecerTono(hex: string): string {
  const [h, s] = rgbAHsl(...hexRgb(hex));
  const out = rgbHex(...hslARgb(h, Math.max(0.5, Math.min(0.85, s)), 0.36));
  return enRango(out) ? out : ajustarTinta(out);
}

/** Tono claro de la emoción, solo como punto de partida antes de variar cada silencio. */
export function silencioDe(emocion: Emocion): string {
  const familia = FAMILIA[emocion];
  let mejor = familia[0] ?? '#E0218A';
  let luz = -1;
  for (const color of familia) {
    const l = rgbAHsl(...hexRgb(color))[2];
    if (l > luz) {
      luz = l;
      mejor = color;
    }
  }
  return variarSilencio(mejor, 0);
}

/** Más luminoso y un poco menos saturado, con el mismo tono. */
export function aclarar(hex: string): string {
  const [r, g, b] = hexRgb(hex);
  const [h, s, l] = rgbAHsl(r, g, b);
  const s2 = Math.max(0.42, s * 0.78);
  const l2 = Math.min(0.74, Math.max(l + 0.12, 0.5));
  let out = rgbHex(...hslARgb(h, s2, l2));
  if (out === hex.toUpperCase() || PALETA.includes(out)) {
    out = rgbHex(...hslARgb(h, Math.max(0.46, s2), 0.62));
  }
  return ajustarTinta(out);
}

export function emocionDeColor(hex: string): Emocion {
  const cercano = tonoMasCercano(hex);
  for (const emocion of EMOCIONES) {
    if (FAMILIA[emocion].some((color) => color.toUpperCase() === cercano)) return emocion;
  }
  return 'calma';
}

function rgbAHsl(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return [h / 6, s, l];
}

function hslARgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const canal = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [Math.round(canal(h + 1 / 3) * 255), Math.round(canal(h) * 255), Math.round(canal(h - 1 / 3) * 255)];
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
  if (luminancia(mixto) + 0.5 < luminancia(cercano)) return ajustarTinta(cercano);
  return ajustarTinta(mixto);
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

/** Misma tinta, otra luminosidad, hasta que separe de los vecinos. */
export function mismaTinta(hex: string, vecinos: string[]): string {
  const [h, s, l] = rgbAHsl(...hexRgb(hex));
  const base = hex.toUpperCase();
  for (const dl of [0.08, -0.08, 0.14, -0.12, 0.2, -0.18]) {
    const out = ajustarTinta(rgbHex(...hslARgb(h, Math.max(0.42, s), Math.min(0.78, Math.max(0.24, l + dl)))));
    if (out === base || !enRango(out)) continue;
    if (vecinos.every((v) => !v || contrastan(out, v))) return out;
  }
  return ajustarTinta(base);
}

export function colorDeEmocion(
  emocion: Emocion,
  _animo: { valencia: number; activacion: number },
  _peso: number,
  rango: number
): string {
  const familia = FAMILIA[emocion];
  return ajustarTinta((familia[Math.abs(rango) % familia.length] ?? familia[0]).toUpperCase());
}

export function colorDePalabra(palabra: string, valencia: number, activacion: number, peso: number): string {
  const familia = valencia >= 0.55 ? FAMILIA.alegría : valencia <= 0.42 ? FAMILIA.tristeza : FAMILIA.nostalgia;
  let h = 0;
  for (let i = 0; i < palabra.length; i++) h = (h + palabra.charCodeAt(i) * (i + 1)) >>> 0;
  if (activacion >= 0.72 && peso >= 0.55) {
    const intensos = INTENSOS.filter((color) => !esCalipso(color));
    return ajustarTinta(intensos[h % intensos.length]!.toUpperCase());
  }
  return ajustarTinta((familia[h % familia.length] ?? INTENSOS[0]).toUpperCase());
}
