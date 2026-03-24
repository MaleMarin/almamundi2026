/**
 * Sistema de Huellas v2 — AlmaMundi
 * Colores y trazos derivados del texto (o del nombre de archivo en fotos), no del formato.
 */

export type HuellaV2Format = 'video' | 'audio' | 'texto' | 'foto';

export type HuellaV2Meta = {
  storyId: string;
  content?: string;
  format?: HuellaV2Format;
  charCount?: number;
  submitHour?: number;
  width?: number;
  height?: number;
};

export const HUELLA_V2_BG = '#F0EFE9';

const STOP_WORDS = new Set([
  'de',
  'la',
  'el',
  'en',
  'y',
  'a',
  'que',
  'los',
  'las',
  'un',
  'una',
  'con',
  'por',
  'del',
  'al',
  'su',
  'se',
  'le',
  'no',
  'si',
  'pero',
  'es',
  'son',
  'era',
  'fue',
  'ser',
  'este',
  'esta',
  'para',
  'como',
  'todo',
  'muy',
  'mas',
  'hay',
  'han',
  'sin',
  'cuando',
  'donde',
  'cada',
  'desde',
  'hasta',
  'sobre',
]);

export function extraerPalabras(texto: string): string[] {
  return texto
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 14);
}

export function palabraAColor(palabra: string): string {
  const vocales = (palabra.match(/[aeiouáéíóú]/gi) || []).length;
  const charSum = [...palabra].reduce((s, c) => s + c.charCodeAt(0), 0);
  const hue = charSum % 360;
  const sat = 60 + (vocales / palabra.length) * 40;
  const lit = 30 + ((palabra.length - vocales) / palabra.length) * 35;
  return `hsl(${hue}, ${sat.toFixed(0)}%, ${lit.toFixed(0)}%)`;
}

export function limpiarNombreFoto(nombre: string): string {
  return nombre
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b(IMG|DSC|DCIM|\d{3,})\b/gi, '')
    .trim();
}

export function seedFn(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function seededRnd(seed: number, i: number): number {
  const x = Math.sin(seed + i) * 10000;
  return x - Math.floor(x);
}

function hslVibrate(hslStr: string, seed: number, i: number): string {
  const m = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hslStr;
  const h = (+m[1] + Math.floor(seededRnd(seed, i * 7 + 1) * 15) - 7 + 360) % 360;
  const s = Math.min(100, +m[2] + 20 + Math.floor(seededRnd(seed, i * 7 + 2) * 15));
  const l = Math.max(20, Math.min(60, +m[3] + Math.floor(seededRnd(seed, i * 7 + 3) * 10) - 5));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function textoBaseParaHuella(meta: HuellaV2Meta): string {
  const { storyId, content = '', format = 'texto' } = meta;
  if (format === 'foto') {
    return limpiarNombreFoto(content) || storyId;
  }
  return content || storyId;
}

export function buildPaletteFromMeta(meta: HuellaV2Meta): { palabras: string[]; paleta: string[] } {
  const texto = textoBaseParaHuella(meta);
  let palabras = extraerPalabras(texto);
  if (palabras.length < 3) {
    palabras = [...palabras, ...extraerPalabras(meta.storyId.replace(/[-_]/g, ' '))];
  }
  if (palabras.length === 0) {
    palabras = ['historia', 'mundo', 'alma'];
  }
  const paleta = palabras.map(palabraAColor);
  return { palabras, paleta };
}

export type HuellaV2Stats = {
  storyId: string;
  palabrasPreview: string;
  numColores: number;
  numLineas: number;
  anguloBase: number;
  seed: number;
};

export function getHuellaV2DrawStats(meta: HuellaV2Meta): HuellaV2Stats {
  const charCount = meta.charCount ?? (meta.content?.length ?? 0);
  const submitHour = meta.submitHour ?? 12;
  const { palabras } = buildPaletteFromMeta(meta);
  const numLineas = Math.floor(140 + (charCount / 4500) * 160);
  const anguloBase = (submitHour / 23 - 0.5) * 22;
  return {
    storyId: meta.storyId,
    palabrasPreview:
      palabras.slice(0, 5).join(', ') + (palabras.length > 5 ? ' …' : ''),
    numColores: palabras.length,
    numLineas,
    anguloBase,
    seed: seedFn(meta.storyId),
  };
}

/**
 * Dibuja la huella v2 en un canvas (usa canvas.width / canvas.height).
 * @returns paleta HSL usada (strings).
 */
export function drawHuellaV2OnCanvas(ctx: CanvasRenderingContext2D, meta: HuellaV2Meta): string[] {
  const { storyId, charCount = 1000, submitHour = 14 } = meta;
  const texto = textoBaseParaHuella(meta);
  let palabras = extraerPalabras(texto);
  if (palabras.length < 3) {
    palabras = [...palabras, ...extraerPalabras(storyId.replace(/[-_]/g, ' '))];
  }
  if (palabras.length === 0) {
    palabras = ['historia', 'mundo', 'alma'];
  }
  const paleta = palabras.map(palabraAColor);
  const S = seedFn(storyId);
  const rnd = (i: number) => seededRnd(S, i);
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const numLineas = Math.floor(140 + (charCount / 4500) * 160);
  const anguloBase = (submitHour / 23 - 0.5) * 22;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = HUELLA_V2_BG;
  ctx.fillRect(0, 0, W, H);

  const pasadas = [
    { frac: 0.35, anchoMin: 6, anchoMax: 28, opMin: 0.55, opMax: 0.85, wobble: 18 },
    { frac: 0.4, anchoMin: 2, anchoMax: 14, opMin: 0.5, opMax: 0.9, wobble: 10 },
    { frac: 0.25, anchoMin: 0.8, anchoMax: 5, opMin: 0.65, opMax: 1.0, wobble: 6 },
  ] as const;

  let lineIdx = 0;
  pasadas.forEach((p, pi) => {
    const n = Math.floor(numLineas * p.frac);
    const step = W / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const ii = lineIdx++;
      const ci = Math.floor(rnd(ii + 10) * paleta.length);
      const color = hslVibrate(paleta[ci]!, S, ii + pi * 1000);
      const ancho = p.anchoMin + rnd(ii + 200) * (p.anchoMax - p.anchoMin);
      const angulo = anguloBase + (rnd(ii + 300) - 0.5) * 32 + (rnd(ii + 301) - 0.5) * 8;
      const opacidad = p.opMin + rnd(ii + 400) * (p.opMax - p.opMin);
      const x = i * step + rnd(ii + 500) * step * 1.1 - W * 0.05;
      const offset = Math.tan((angulo * Math.PI) / 180) * H;
      const overshot = H * 0.15;
      const x1 = x - offset / 2 + (rnd(ii + 601) - 0.5) * ancho * 0.5;
      const x2 = x + offset / 2 + (rnd(ii + 602) - 0.5) * ancho * 0.5;
      const wobbleAmt = p.wobble;
      const cx1 = x1 + (rnd(ii + 700) - 0.5) * wobbleAmt;
      const cy1 = H * 0.3 + rnd(ii + 701) * H * 0.1;
      const cx2 = x2 + (rnd(ii + 702) - 0.5) * wobbleAmt;
      const cy2 = H * 0.65 + rnd(ii + 703) * H * 0.1;

      ctx.beginPath();
      ctx.moveTo(x1, -overshot);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, H + overshot);
      ctx.strokeStyle = color;
      ctx.lineWidth = ancho;
      ctx.globalAlpha = opacidad;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  const nAcento = Math.floor(4 + rnd(9999) * 6);
  for (let i = 0; i < nAcento; i++) {
    const ii = lineIdx++;
    const ci = Math.floor(rnd(ii + 50) * paleta.length);
    const color = hslVibrate(paleta[ci]!, S, ii + 5000);
    const ancho = 18 + rnd(ii + 800) * 22;
    const angulo = anguloBase + (rnd(ii + 900) - 0.5) * 20;
    const opacidad = 0.25 + rnd(ii + 901) * 0.35;
    const x = -W * 0.1 + rnd(ii + 902) * W * 1.2;
    const offset = Math.tan((angulo * Math.PI) / 180) * H;
    const cx1 = x - offset / 3 + (rnd(ii + 903) - 0.5) * 30;
    const cx2 = x + offset / 3 + (rnd(ii + 904) - 0.5) * 30;
    ctx.beginPath();
    ctx.moveTo(x - offset / 2, -H * 0.1);
    ctx.bezierCurveTo(cx1, H * 0.35, cx2, H * 0.65, x + offset / 2, H * 1.1);
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.globalAlpha = opacidad;
    ctx.lineCap = 'butt';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  return paleta;
}

/**
 * Versión SVG con líneas rectas (útil para export estático / imprimir).
 */
export function generateHuellaSvg(meta: HuellaV2Meta): string {
  const {
    storyId,
    content = '',
    format = 'texto',
    charCount = 1000,
    submitHour = 12,
    width = 400,
    height = 500,
  } = meta;

  const texto = format === 'foto' ? limpiarNombreFoto(content) || storyId : content || storyId;
  let palabras = extraerPalabras(texto);
  if (palabras.length < 3) {
    palabras = [...palabras, ...extraerPalabras(storyId.replace(/-/g, ' '))];
  }
  if (palabras.length === 0) {
    palabras = ['historia', 'mundo', 'alma'];
  }
  const paleta = palabras.map(palabraAColor);
  const S = seedFn(storyId);
  const rnd = (i: number) => seededRnd(S, i);
  const numLineas = Math.floor(80 + (charCount / 4500) * 120);
  const anguloBase = (submitHour / 23 - 0.5) * 28;
  const step = width / numLineas;

  let lines = '';
  for (let i = 0; i < numLineas; i++) {
    const colorIdx = Math.floor(rnd(i + 10) * paleta.length) % paleta.length;
    const stroke = paleta[colorIdx] ?? '#888888';
    const ancho = 1.5 + rnd(i + 200) * 16;
    const angulo = anguloBase + (rnd(i + 300) - 0.5) * 26;
    const opacidad = 0.35 + rnd(i + 400) * 0.65;
    const x = i * step + rnd(i + 500) * step * 0.8;
    const offset = Math.tan((angulo * Math.PI) / 180) * height;
    lines += `<line x1="${(x - offset / 2).toFixed(1)}" y1="0" x2="${(x + offset / 2).toFixed(1)}" y2="${height}" stroke="${stroke}" stroke-width="${ancho.toFixed(1)}" opacity="${opacidad.toFixed(2)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${HUELLA_V2_BG}"/>${lines}</svg>`;
}
