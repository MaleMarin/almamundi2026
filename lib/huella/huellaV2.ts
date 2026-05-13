/**
 * Huella v2 — «Cintas de memoria» AlmaMundi
 *
 * Capas del sistema (v1 controlada):
 * 1. `buildPaletteFromMeta` / `buildHuellaV2VisualParams` — parámetros + paleta determinística (seed).
 * 2. `drawHuellaV2OnCanvas` — render 2D.
 * 3. `canvas.toDataURL` / `toBlob` — export PNG (en componentes).
 *
 * Lenguaje de producto: interpretación visual / recuerdo visual (sin lectura «clínica»).
 */

import type { HuellaV2VisualParams, HuellaV2Format } from '@/lib/huella/types';

export type { HuellaV2Format };

export type HuellaV2Meta = {
  storyId: string;
  content?: string;
  format?: HuellaV2Format;
  charCount?: number;
  submitHour?: number;
  width?: number;
  height?: number;
  /** Pie tipo «recuerdo» con identidad del sitio. */
  embedSiteFooter?: boolean;
  footerAt?: Date;
  embedStoryTitle?: string;
  /** Etiqueta legible del formato (p. ej. «Video») para el pie descargable. */
  embedFormatLabel?: string;
  /** URL pública de la historia (si existe) — se trunca en canvas si hace falta. */
  embedPublicUrl?: string;
};

/** Fondo alineado a interiores neumórficos claros. */
export const HUELLA_V2_BG = '#E0E5EC';

export const HUELLA_V2_SITE_DISPLAY = 'www.almamundi.org';

/** Hasta 5 palabras guía; el resto no influye en la paleta reducida. */
export const HUELLA_V2_MAX_PALABRAS = 5;

const MAIN_RIBBON_COLORS = 5;

/** Anclas HSL [h, s%, l%] por formato: gamas cercanas, baja saturación (evitar arcoíris). */
const FORMAT_ANCHORS: Record<HuellaV2Format, [number, number, number][]> = {
  video: [
    [16, 38, 52],
    [24, 34, 48],
    [12, 36, 54],
    [32, 40, 50],
    [20, 42, 46],
  ],
  audio: [
    [196, 36, 50],
    [204, 40, 48],
    [188, 34, 52],
    [172, 38, 46],
    [210, 32, 54],
  ],
  texto: [
    [220, 32, 48],
    [212, 36, 52],
    [228, 30, 46],
    [205, 34, 50],
    [235, 28, 54],
  ],
  foto: [
    [36, 38, 50],
    [28, 40, 48],
    [44, 36, 52],
    [32, 34, 54],
    [48, 42, 46],
  ],
};

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
  'entre',
  'estos',
  'estas',
  'algo',
  'alguien',
  'tanto',
  'aunque',
]);

export function extraerPalabras(texto: string): string[] {
  return texto
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, HUELLA_V2_MAX_PALABRAS);
}

/** @deprecated Preferir paleta anclada por formato (`buildPaletteFromMeta`). Solo referencia / demos. */
export function palabraAColor(palabra: string): string {
  const vocales = (palabra.match(/[aeiouáéíóú]/gi) || []).length;
  const charSum = [...palabra].reduce((s, c) => s + c.charCodeAt(0), 0);
  const hue = charSum % 360;
  const sat = Math.min(55, 38 + (vocales / Math.max(palabra.length, 1)) * 14);
  const lit = Math.max(40, Math.min(56, 46 + ((palabra.length - vocales) / Math.max(palabra.length, 1)) * 10));
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

function hslCss(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(22, Math.min(46, s));
  const ll = Math.max(42, Math.min(58, l));
  return `hsl(${hh.toFixed(0)}, ${ss.toFixed(0)}%, ${ll.toFixed(0)}%)`;
}

/** Variación suave por palabra + seed (determinística). */
function matizDesdePalabra(palabra: string, seed: number, slot: number): { dh: number; ds: number; dl: number } {
  let a = seedFn(palabra + String(seed) + String(slot));
  const dh = (a % 19) - 9;
  a = Math.imul(a, 1103515245) + 12345;
  const ds = ((a >>> 0) % 9) - 4;
  a = Math.imul(a, 1103515245) + 12345;
  const dl = ((a >>> 0) % 7) - 3;
  return { dh, ds, dl };
}

function textoBaseParaHuella(meta: HuellaV2Meta): string {
  const { storyId, content = '', format = 'texto' } = meta;
  if (format === 'foto') {
    return limpiarNombreFoto(content) || storyId;
  }
  return content || storyId;
}

/**
 * Paleta principal: 5 tonos anclados al formato + matiz por palabras (interpretación visual).
 */
export function buildPaletteFromMeta(meta: HuellaV2Meta): { palabras: string[]; paleta: string[] } {
  const formato: HuellaV2Format = meta.format ?? 'texto';
  const texto = textoBaseParaHuella(meta);
  let palabras = extraerPalabras(texto);
  if (palabras.length < 2) {
    palabras = [...palabras, ...extraerPalabras(meta.storyId.replace(/[-_]/g, ' '))];
  }
  if (palabras.length === 0) {
    palabras = ['memoria', 'relato', 'lugar', 'tiempo', 'voz'];
  }
  const seed = seedFn(meta.storyId);
  const anchors = FORMAT_ANCHORS[formato];
  const paleta: string[] = [];
  for (let i = 0; i < MAIN_RIBBON_COLORS; i++) {
    const [h0, s0, l0] = anchors[i] ?? anchors[0]!;
    const w = palabras[i % palabras.length] ?? 'memoria';
    const { dh, ds, dl } = matizDesdePalabra(w, seed, i);
    paleta.push(hslCss(h0 + dh, s0 + ds, l0 + dl));
  }
  return { palabras, paleta };
}

/** Parámetros listos para guardar en Firestore u otro backend (misma semilla ⇒ mismo dibujo). */
export function buildHuellaV2VisualParams(meta: HuellaV2Meta): HuellaV2VisualParams {
  const charCount = meta.charCount ?? meta.content?.length ?? 0;
  const submitHour = meta.submitHour ?? 12;
  const formato = meta.format ?? 'texto';
  const { paleta, palabras } = buildPaletteFromMeta(meta);
  const seed = seedFn(meta.storyId);
  const anguloBase = (submitHour / 23 - 0.5) * 20;
  const ribbonCount = Math.min(56, Math.floor(26 + (charCount / 11000) * 30));
  return {
    version: 1,
    seed,
    format: formato,
    palette: paleta,
    wordHints: palabras.slice(0, MAIN_RIBBON_COLORS),
    ribbonCount,
    anguloBase,
    charCount,
    submitHour,
  };
}

function hslSubtleShift(hslStr: string, seed: number, i: number): string {
  const m = hslStr.match(/hsl\((-?\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hslStr;
  let h = +m[1];
  let s = +m[2];
  let l = +m[3];
  h = (h + Math.floor((seededRnd(seed, i * 5 + 1) - 0.5) * 10) + 360) % 360;
  s = Math.max(24, Math.min(48, s + Math.floor((seededRnd(seed, i * 5 + 2) - 0.5) * 6)));
  l = Math.max(44, Math.min(58, l + Math.floor((seededRnd(seed, i * 5 + 3) - 0.5) * 5)));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

const MESES_CORTO = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

function truncateCanvasLine(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  const ell = '…';
  let t = text.trim();
  while (t.length > 0 && ctx.measureText(t + ell).width > maxW) {
    t = t.slice(0, -1);
  }
  return t ? t + ell : ell;
}

function drawHuellaSiteFooter(
  ctx: CanvasRenderingContext2D,
  at: Date,
  storyTitle: string | undefined,
  formatLabel: string | undefined,
  publicUrl: string | undefined
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const title = storyTitle?.trim();
  const hasTitle = Boolean(title);
  const fmt = formatLabel?.trim();
  const urlLine = publicUrl?.trim() || `https://${HUELLA_V2_SITE_DISPLAY}`;
  const hasFooterDetail = Boolean(hasTitle || fmt);
  const fH = H * (hasFooterDetail ? 0.14 : 0.1);
  const fechaCorta = `${at.getDate()} ${MESES_CORTO[at.getMonth()]} ${at.getFullYear()}`;
  const metaParts = [fechaCorta, fmt, urlLine].filter(Boolean);
  const metaLine = metaParts.join(' · ');

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = HUELLA_V2_BG;
  ctx.fillRect(0, H - fH, W, fH);
  ctx.shadowColor = 'rgba(163, 177, 198, 0.35)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = -2;
  ctx.beginPath();
  ctx.moveTo(0, H - fH);
  ctx.lineTo(W, H - fH);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowOffsetY = 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bandTop = H - fH;
  const maxW = W * 0.92;

  const brandPx = Math.max(10, Math.round(W * 0.022));
  ctx.fillStyle = '#ff4500';
  ctx.font = `600 ${brandPx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText('AlmaMundi', W / 2, bandTop + fH * 0.22);

  if (hasTitle && title) {
    const titlePx = Math.max(11, Math.round(W * 0.028));
    ctx.fillStyle = '#334155';
    ctx.font = `500 ${titlePx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const lineTitle = truncateCanvasLine(ctx, title, maxW);
    ctx.fillText(lineTitle, W / 2, bandTop + fH * 0.48);
  }

  const captionPx = Math.max(8, Math.round(W * 0.018));
  ctx.fillStyle = '#94a3b8';
  ctx.font = `400 ${captionPx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText('Resonancia visual', W / 2, bandTop + fH * (hasTitle ? 0.68 : 0.48));

  const metaPx = Math.max(9, Math.round(W * 0.019));
  ctx.fillStyle = '#64748b';
  ctx.font = `400 ${metaPx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  const lineMeta = truncateCanvasLine(ctx, metaLine, maxW);
  ctx.fillText(lineMeta, W / 2, bandTop + fH * (hasTitle ? 0.88 : 0.76));
  ctx.restore();
}

export type HuellaV2Stats = {
  storyId: string;
  palabrasPreview: string;
  numColores: number;
  numLineas: number;
  anguloBase: number;
  numLineasSvg: number;
  anguloBaseSvg: number;
  seed: number;
};

export function getHuellaV2DrawStats(meta: HuellaV2Meta): HuellaV2Stats {
  const charCount = meta.charCount ?? meta.content?.length ?? 0;
  const submitHour = meta.submitHour ?? 12;
  const { palabras } = buildPaletteFromMeta(meta);
  const params = buildHuellaV2VisualParams(meta);
  const numLineasSvg = Math.floor(52 + (charCount / 9000) * 48);
  const anguloBaseSvg = (submitHour / 23 - 0.5) * 24;
  return {
    storyId: meta.storyId,
    palabrasPreview: palabras.slice(0, 5).join(', ') + (palabras.length > 5 ? ' …' : ''),
    numColores: params.palette.length,
    numLineas: params.ribbonCount,
    anguloBase: params.anguloBase,
    numLineasSvg,
    anguloBaseSvg,
    seed: params.seed,
  };
}

export function drawHuellaV2OnCanvas(ctx: CanvasRenderingContext2D, meta: HuellaV2Meta): string[] {
  const {
    storyId,
    charCount = 1000,
    submitHour = 14,
    embedSiteFooter,
    footerAt,
    embedStoryTitle,
    embedFormatLabel,
    embedPublicUrl,
  } = meta;

  const { paleta } = buildPaletteFromMeta(meta);
  const params = buildHuellaV2VisualParams(meta);
  const S = params.seed;
  const rnd = (i: number) => seededRnd(S, i);
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const contentFrac =
    embedSiteFooter && (embedStoryTitle?.trim() || embedFormatLabel?.trim()) ? 0.14 : embedSiteFooter ? 0.1 : 0;
  const contentH = H * (1 - contentFrac);
  const numLineas = params.ribbonCount;
  const anguloBase = params.anguloBase;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = HUELLA_V2_BG;
  ctx.fillRect(0, 0, W, H);

  const pasadas = [
    { frac: 0.52, anchoMin: 14, anchoMax: 42, opMin: 0.35, opMax: 0.58, wobble: 28 },
    { frac: 0.38, anchoMin: 2, anchoMax: 10, opMin: 0.45, opMax: 0.78, wobble: 14 },
  ] as const;

  const ACCENT_HSL = 'hsl(16, 72%, 52%)';

  let lineIdx = 0;
  pasadas.forEach((p, pi) => {
    const n = Math.floor(numLineas * p.frac);
    const step = W / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const ii = lineIdx++;
      const ci = Math.floor(rnd(ii + 10) * paleta.length);
      const color = hslSubtleShift(paleta[ci]!, S, ii + pi * 900);
      const ancho = p.anchoMin + rnd(ii + 200) * (p.anchoMax - p.anchoMin);
      const angulo = anguloBase + (rnd(ii + 300) - 0.5) * 22 + (rnd(ii + 301) - 0.5) * 8;
      const opacidad = p.opMin + rnd(ii + 400) * (p.opMax - p.opMin);
      const x = i * step + rnd(ii + 500) * step * 0.85 - W * 0.04;
      const offset = Math.tan((angulo * Math.PI) / 180) * contentH;
      const over = contentH * 0.12;
      const x1 = x - offset / 2;
      const x2 = x + offset / 2;
      const cx1 = x1 + (rnd(ii + 700) - 0.5) * p.wobble * 2.2;
      const cy1 = contentH * 0.26 + rnd(ii + 701) * contentH * 0.14;
      const cx2 = x2 + (rnd(ii + 702) - 0.5) * p.wobble * 2.2;
      const cy2 = contentH * 0.64 + rnd(ii + 703) * contentH * 0.14;

      ctx.beginPath();
      ctx.moveTo(x1, -over);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, contentH + over);
      ctx.strokeStyle = color;
      ctx.lineWidth = ancho;
      ctx.globalAlpha = opacidad;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  const nAcento = 2 + Math.floor(rnd(9998) * 2);
  for (let i = 0; i < nAcento; i++) {
    const ii = lineIdx++;
    const ancho = 22 + rnd(ii + 800) * 28;
    const angulo = anguloBase + (rnd(ii + 900) - 0.5) * 14;
    const opacidad = 0.1 + rnd(ii + 901) * 0.14;
    const x = -W * 0.08 + rnd(ii + 902) * W * 1.2;
    const offset = Math.tan((angulo * Math.PI) / 180) * contentH;
    const cx1 = x - offset / 3 + (rnd(ii + 903) - 0.5) * 32;
    const cx2 = x + offset / 3 + (rnd(ii + 904) - 0.5) * 32;
    ctx.beginPath();
    ctx.moveTo(x - offset / 2, -contentH * 0.08);
    ctx.bezierCurveTo(cx1, contentH * 0.34, cx2, contentH * 0.66, x + offset / 2, contentH * 1.06);
    ctx.strokeStyle = ACCENT_HSL;
    ctx.lineWidth = ancho;
    ctx.globalAlpha = opacidad;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (embedSiteFooter) {
    drawHuellaSiteFooter(ctx, footerAt ?? new Date(), embedStoryTitle, embedFormatLabel, embedPublicUrl);
  }

  return paleta;
}

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
  const metaForPal: HuellaV2Meta = { storyId, content: texto, format };
  const { paleta } = buildPaletteFromMeta(metaForPal);
  const S = seedFn(storyId);
  const rnd = (i: number) => seededRnd(S, i);
  const numLineas = Math.min(72, Math.floor(40 + (charCount / 9000) * 32));
  const anguloBase = (submitHour / 23 - 0.5) * 22;
  const step = width / numLineas;

  let lines = '';
  for (let i = 0; i < numLineas; i++) {
    const colorIdx = Math.floor(rnd(i + 10) * paleta.length) % paleta.length;
    const stroke = hslSubtleShift(paleta[colorIdx] ?? '#888888', S, i);
    const ancho = 1.2 + rnd(i + 200) * 9;
    const angulo = anguloBase + (rnd(i + 300) - 0.5) * 18;
    const opacidad = 0.38 + rnd(i + 400) * 0.45;
    const x = i * step + rnd(i + 500) * step * 0.65;
    const offset = Math.tan((angulo * Math.PI) / 180) * height;
    lines += `<line x1="${(x - offset / 2).toFixed(1)}" y1="0" x2="${(x + offset / 2).toFixed(1)}" y2="${height}" stroke="${stroke}" stroke-width="${ancho.toFixed(1)}" opacity="${opacidad.toFixed(2)}" stroke-linecap="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${HUELLA_V2_BG}"/>${lines}</svg>`;
}

export const generateHuella = generateHuellaSvg;
