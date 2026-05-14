/**
 * Resonancia visual AlmaMundi — cintas fluidas (referencias: flowing_ribbons_of_soft_color,
 * flowing_ribbons_of_color_and_texture). Dos familias: soft-ribbons y kinetic-ribbons.
 *
 * Capas: paleta determinista → campo de cintas (Bézier, gradientes, transparencia, textura fina) → pie editorial.
 */

import type { HuellaV2VisualParams, HuellaV2Format } from '@/lib/huella/types';

export type { HuellaV2Format };

export type ResonanceFamily = 'soft-ribbons' | 'kinetic-ribbons';
export type ResonanceOrientation = 'vertical' | 'horizontal' | 'square';

export type HuellaV2Meta = {
  storyId: string;
  content?: string;
  format?: HuellaV2Format;
  charCount?: number;
  submitHour?: number;
  width?: number;
  height?: number;
  /** Override de familia (misma historia ⇒ mismo valor por defecto desde `chooseResonanceFamily`). */
  resonanceFamily?: ResonanceFamily;
  /** Override de orientación; si no, se infiere del lienzo. */
  orientation?: ResonanceOrientation;
  embedSiteFooter?: boolean;
  footerAt?: Date;
  embedStoryTitle?: string;
  embedFormatLabel?: string;
  embedPublicUrl?: string;
};

export const HUELLA_V2_BG = '#E8ECF2';
export const HUELLA_V2_SITE_DISPLAY = 'www.almamundi.org';
export const HUELLA_V2_MAX_PALABRAS = 5;

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'que', 'los', 'las', 'un', 'una', 'con', 'por', 'del', 'al', 'su', 'se', 'le',
  'no', 'si', 'pero', 'es', 'son', 'era', 'fue', 'ser', 'este', 'esta', 'para', 'como', 'todo', 'muy', 'mas', 'hay',
  'han', 'sin', 'cuando', 'donde', 'cada', 'desde', 'hasta', 'sobre', 'entre', 'estos', 'estas', 'algo', 'alguien',
  'tanto', 'aunque',
]);

/** Presets HSL [h,s,l] — naranja AlmaMundi, coral, rojo cálido, azul profundo, teal, turquesa, violeta, oro, rosa. */
const TONE_PRESETS: readonly [number, number, number][] = [
  [16, 88, 54],
  [12, 82, 58],
  [355, 72, 48],
  [222, 58, 36],
  [188, 52, 42],
  [172, 48, 44],
  [268, 46, 46],
  [44, 90, 54],
  [328, 72, 56],
] as const;

export function extraerPalabras(texto: string): string[] {
  return texto
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, HUELLA_V2_MAX_PALABRAS);
}

/** @deprecated Preferir `buildResonancePalette`. */
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

function hsl(h: number, s: number, l: number, a = 1): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(18, Math.min(92, s));
  const ll = Math.max(28, Math.min(72, l));
  return a < 1 ? `hsla(${hh.toFixed(0)}, ${ss.toFixed(0)}%, ${ll.toFixed(0)}%, ${a.toFixed(3)})` : `hsl(${hh.toFixed(0)}, ${ss.toFixed(0)}%, ${ll.toFixed(0)}%)`;
}

function textoBaseParaHuella(meta: HuellaV2Meta): string {
  const { storyId, content = '', format = 'texto' } = meta;
  if (format === 'foto') {
    return limpiarNombreFoto(content) || storyId;
  }
  return content || storyId;
}

/**
 * Familia visual determinista: misma historia + formato + longitud ⇒ misma familia.
 * — kinetic: video; textos largos; audio con mucho contexto.
 * — soft: foto; textos breves; audio breve.
 */
export function chooseResonanceFamily(meta: HuellaV2Meta): ResonanceFamily {
  if (meta.resonanceFamily) return meta.resonanceFamily;
  const fmt = meta.format ?? 'texto';
  const cc = Math.max(0, meta.charCount ?? meta.content?.length ?? 0);
  const tie = seededRnd(seedFn(meta.storyId), 404);
  if (fmt === 'video') return 'kinetic-ribbons';
  if (fmt === 'foto') return 'soft-ribbons';
  if (fmt === 'audio') {
    if (cc < 420) return 'soft-ribbons';
    if (cc > 900) return 'kinetic-ribbons';
    return tie < 0.45 ? 'soft-ribbons' : 'kinetic-ribbons';
  }
  if (cc < 720) return 'soft-ribbons';
  if (cc > 2800) return 'kinetic-ribbons';
  return tie < 0.38 ? 'soft-ribbons' : 'kinetic-ribbons';
}

/** Inferencia por proporción del lienzo (vertical móvil, horizontal web, cuadrado redes). */
export function inferResonanceOrientation(width: number, height: number): ResonanceOrientation {
  if (width <= 1 || height <= 1) return 'vertical';
  const r = width / height;
  if (r < 0.92) return 'vertical';
  if (r > 1.12) return 'horizontal';
  return 'square';
}

export type ResonancePalette = {
  dominant: string;
  secondaryA: string;
  secondaryB: string;
  accent: string;
  air: string;
  cream: string;
};

/** Paleta jerárquica: 1 dominante, 2 secundarios, 1 acento fuerte, aire y crema (sin arcoíris aleatorio). */
export function buildResonancePalette(meta: HuellaV2Meta, family: ResonanceFamily): ResonancePalette {
  const S = seedFn(meta.storyId + '|' + (meta.format ?? 'x'));
  const words = extraerPalabras(textoBaseParaHuella(meta));
  const wkey = words.length ? words.join('|') : meta.storyId;
  const idx = seedFn(wkey + String(S)) % TONE_PRESETS.length;
  const pick = (off: number) => {
    const [h0, s0, l0] = TONE_PRESETS[(idx + off) % TONE_PRESETS.length]!;
    const j = seededRnd(S, off * 17 + 3);
    const dh = (j - 0.5) * 14;
    const ds = (seededRnd(S, off * 19 + 5) - 0.5) * 10;
    const dl = family === 'soft-ribbons' ? 6 + seededRnd(S, off * 23 + 7) * 8 : (seededRnd(S, off * 23 + 7) - 0.5) * 6;
    return hsl(h0 + dh, s0 + ds, l0 + dl);
  };
  const dominant = pick(0);
  const secondaryA = pick(2);
  const secondaryB = pick(4);
  const accent = hsl(16 + (seededRnd(S, 91) - 0.5) * 8, 90, 52 + seededRnd(S, 92) * 6);
  const air = family === 'soft-ribbons' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.52)';
  const cream = hsl(210, 22, 96, 0.9);
  return { dominant, secondaryA, secondaryB, accent, air, cream };
}

/** @deprecated Usar `buildResonancePalette`; se mantiene para compat. */
export function buildPaletteFromMeta(meta: HuellaV2Meta): { palabras: string[]; paleta: string[] } {
  const fam = chooseResonanceFamily(meta);
  const p = buildResonancePalette(meta, fam);
  const palabras = extraerPalabras(textoBaseParaHuella(meta));
  if (palabras.length === 0) {
    return { palabras: ['memoria', 'relato', 'lugar', 'tiempo', 'voz'], paleta: [p.dominant, p.secondaryA, p.secondaryB, p.accent, p.cream] };
  }
  return { palabras, paleta: [p.dominant, p.secondaryA, p.secondaryB, p.accent, p.cream] };
}

type RibbonBudget = { thick: number; thin: number; accent: number; texture: number };

function ribbonBudget(meta: HuellaV2Meta, family: ResonanceFamily): RibbonBudget {
  const cc = Math.max(1, meta.charCount ?? meta.content?.length ?? 400);
  const fmt = meta.format ?? 'texto';
  const S = seedFn(meta.storyId);
  const long = cc > 2000;
  const short = cc < 550;

  if (family === 'soft-ribbons') {
    const baseThick = fmt === 'foto' ? 11 : fmt === 'audio' ? 12 : 10;
    const thick = Math.floor((baseThick + seededRnd(S, 2) * 6) * (short ? 0.75 : long ? 1.05 : 1));
    const thin = Math.floor((34 + seededRnd(S, 4) * 28) * (long ? 1.15 : 1) * (short ? 0.82 : 1));
    const accent = 2 + Math.floor(seededRnd(S, 6) * 2);
    const texture = 240 + Math.floor(seededRnd(S, 8) * 160);
    return { thick: Math.max(6, thick), thin: Math.max(18, thin), accent, texture };
  }

  const baseThick = fmt === 'video' ? 18 : 14;
  const thick = Math.floor((baseThick + seededRnd(S, 12) * 10) * (long ? 1.12 : short ? 0.88 : 1));
  const thin = Math.floor((52 + seededRnd(S, 14) * 48) * (long ? 1.25 : 1) * (short ? 0.75 : 1));
  const accent = fmt === 'video' ? 5 + Math.floor(seededRnd(S, 16) * 3) : 3 + Math.floor(seededRnd(S, 16) * 3);
  const texture = 360 + Math.floor(seededRnd(S, 18) * 220);
  return { thick: Math.max(8, thick), thin: Math.max(28, thin), accent, texture };
}

function drawBackgroundWash(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cw: number,
  ch: number,
  pal: ResonancePalette,
  family: ResonanceFamily
): void {
  const g = ctx.createLinearGradient(left, top, left + cw, top + ch);
  if (family === 'soft-ribbons') {
    g.addColorStop(0, 'rgba(255,255,255,0.92)');
    g.addColorStop(0.4, 'rgba(236,240,247,0.85)');
    g.addColorStop(1, 'rgba(214,222,235,0.55)');
  } else {
    g.addColorStop(0, 'rgba(255,255,255,0.88)');
    g.addColorStop(0.35, 'rgba(230,236,246,0.7)');
    g.addColorStop(1, 'rgba(200,210,228,0.45)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(left, top, cw, ch);
  const rg = ctx.createRadialGradient(left + cw * 0.35, top + ch * 0.25, 0, left + cw * 0.35, top + ch * 0.25, Math.max(cw, ch) * 0.65);
  rg.addColorStop(0, family === 'soft-ribbons' ? 'rgba(255,255,255,0.35)' : hslaFromCss(pal.dominant, 0.12));
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(left, top, cw, ch);
}

function hslaFromCss(hslStr: string, alpha: number): string {
  const m = hslStr.match(/hsl\((-?\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  if (!m) return `rgba(255,255,255,${alpha})`;
  return `hsla(${m[1]}, ${m[2]}%, ${m[3]}%, ${alpha})`;
}

function strokeRibbon(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
  alpha: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, hslaFromCss(color, alpha * 0.35));
  grad.addColorStop(0.5, hslaFromCss(color, alpha));
  grad.addColorStop(1, hslaFromCss(color, alpha * 0.4));
  ctx.strokeStyle = grad;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.restore();
}

function drawTexture(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cw: number,
  ch: number,
  n: number,
  S: number,
  colors: string[],
  family: ResonanceFamily
): void {
  for (let i = 0; i < n; i++) {
    const x = left + seededRnd(S, i * 3 + 900) * cw;
    const y = top + seededRnd(S, i * 3 + 901) * ch;
    const col = colors[i % colors.length]!;
    ctx.fillStyle = col;
    ctx.globalAlpha = family === 'soft-ribbons' ? 0.04 + seededRnd(S, i + 902) * 0.07 : 0.06 + seededRnd(S, i + 902) * 0.1;
    if (seededRnd(S, i + 903) < 0.55) {
      const r = 0.6 + seededRnd(S, i + 904) * 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const len = 4 + seededRnd(S, i + 905) * 18;
      const ang = seededRnd(S, i + 906) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.strokeStyle = col;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function generateRibbonField(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cw: number,
  ch: number,
  family: ResonanceFamily,
  pal: ResonancePalette,
  S: number,
  budget: RibbonBudget
): void {
  const rnd = (k: number) => seededRnd(S, k);
  const colors = [pal.dominant, pal.secondaryA, pal.secondaryB, pal.cream, pal.accent];
  const opThick = family === 'soft-ribbons' ? [0.1, 0.22] : ([0.14, 0.32] as const);
  const opThin = family === 'soft-ribbons' ? [0.18, 0.38] : ([0.22, 0.48] as const);

  for (let i = 0; i < budget.thick; i++) {
    const t = (i + 0.5) / Math.max(1, budget.thick);
    const xBase = left + cw * (0.06 + t * 0.88) + (rnd(i * 7) - 0.5) * cw * 0.1;
    const wob = cw * (0.035 + rnd(i * 11) * 0.09);
    const y0 = top - ch * 0.08;
    const y1 = top + ch * 1.08;
    const cx1 = xBase - wob * 1.4 + (rnd(i * 13) - 0.5) * cw * 0.05;
    const cy1 = top + ch * (0.22 + rnd(i * 17) * 0.18);
    const cx2 = xBase + wob * 1.2 + (rnd(i * 19) - 0.5) * cw * 0.05;
    const cy2 = top + ch * (0.58 + rnd(i * 23) * 0.16);
    const col = colors[i % colors.length]!;
    const lw = family === 'soft-ribbons' ? 26 + rnd(i * 29) * 34 : 16 + rnd(i * 29) * 42;
    const op = opThick[0] + rnd(i * 31) * (opThick[1] - opThick[0]);
    strokeRibbon(ctx, xBase - wob, y0, cx1, cy1, cx2, cy2, xBase + wob * 0.9, y1, col, lw, op);
  }

  for (let i = 0; i < budget.thin; i++) {
    const t = rnd(i * 41);
    const xBase = left + cw * (0.04 + t * 0.92) + (rnd(i * 43) - 0.5) * cw * 0.12;
    const wob = cw * (0.02 + rnd(i * 47) * 0.06);
    const y0 = top - ch * 0.04;
    const y1 = top + ch * 1.04;
    const cx1 = xBase + (rnd(i * 53) - 0.5) * cw * 0.08;
    const cy1 = top + ch * (0.3 + rnd(i * 59) * 0.15);
    const cx2 = xBase + (rnd(i * 61) - 0.5) * cw * 0.08;
    const cy2 = top + ch * (0.55 + rnd(i * 67) * 0.18);
    const col = colors[(i + 2) % colors.length]!;
    const lw = family === 'soft-ribbons' ? 1.5 + rnd(i * 71) * 5 : 1.2 + rnd(i * 71) * 7;
    const op = opThin[0] + rnd(i * 73) * (opThin[1] - opThin[0]);
    strokeRibbon(ctx, xBase - wob, y0, cx1, cy1, cx2, cy2, xBase + wob, y1, col, lw, op);
    if (family === 'kinetic-ribbons' && i % 5 === 0) {
      const ox = (rnd(i * 79) - 0.5) * 6;
      strokeRibbon(ctx, xBase - wob + ox, y0, cx1 + ox * 0.5, cy1, cx2 + ox * 0.5, cy2, xBase + wob + ox, y1, col, lw * 0.45, op * 0.55);
    }
  }

  for (let a = 0; a < budget.accent; a++) {
    const xBase = left + cw * (0.1 + rnd(a * 83) * 0.8);
    const wob = cw * (0.05 + rnd(a * 87) * 0.12);
    const y0 = top - ch * 0.02;
    const y1 = top + ch * 1.02;
    const cx1 = xBase + (rnd(a * 89) - 0.5) * cw * 0.12;
    const cy1 = top + ch * (0.35 + rnd(a * 97) * 0.2);
    const cx2 = xBase + (rnd(a * 99) - 0.5) * cw * 0.12;
    const cy2 = top + ch * (0.65 + rnd(a * 101) * 0.12);
    strokeRibbon(ctx, xBase - wob, y0, cx1, cy1, cx2, cy2, xBase + wob, y1, pal.accent, 10 + rnd(a * 103) * 26, 0.09 + rnd(a * 107) * 0.14);
  }

  drawTexture(ctx, left, top, cw, ch, budget.texture, S, colors, family);
}

function renderSoftRibbons(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cw: number,
  ch: number,
  meta: HuellaV2Meta,
  pal: ResonancePalette,
  S: number
): void {
  drawBackgroundWash(ctx, left, top, cw, ch, pal, 'soft-ribbons');
  const budget = ribbonBudget(meta, 'soft-ribbons');
  generateRibbonField(ctx, left, top, cw, ch, 'soft-ribbons', pal, S, budget);
}

function renderKineticRibbons(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cw: number,
  ch: number,
  meta: HuellaV2Meta,
  pal: ResonancePalette,
  S: number
): void {
  drawBackgroundWash(ctx, left, top, cw, ch, pal, 'kinetic-ribbons');
  const budget = ribbonBudget(meta, 'kinetic-ribbons');
  generateRibbonField(ctx, left, top, cw, ch, 'kinetic-ribbons', pal, S, budget);
}

/** Dibuja el campo de cintas según familia, dentro del rectángulo (ya clipado si aplica). */
function drawOrientedRibbonField(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  orientation: ResonanceOrientation,
  family: ResonanceFamily,
  meta: HuellaV2Meta,
  pal: ResonancePalette,
  S: number,
  footerFrac: number
): void {
  const contentH = H * (1 - footerFrac);

  ctx.save();

  if (orientation === 'horizontal') {
    ctx.translate(W, 0);
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.rect(0, 0, contentH, W);
    ctx.clip();
    if (family === 'soft-ribbons') renderSoftRibbons(ctx, 0, 0, contentH, W, meta, pal, S);
    else renderKineticRibbons(ctx, 0, 0, contentH, W, meta, pal, S);
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, W, contentH);
    ctx.clip();
    if (orientation === 'square') {
      const cx = W / 2;
      const cy = contentH / 2;
      ctx.translate(cx, cy);
      ctx.rotate(-0.12 + (seededRnd(S, 512) - 0.5) * 0.22);
      ctx.translate(-cx, -cy);
    }
    if (family === 'soft-ribbons') renderSoftRibbons(ctx, 0, 0, W, contentH, meta, pal, S);
    else renderKineticRibbons(ctx, 0, 0, W, contentH, meta, pal, S);
  }

  ctx.restore();
}

const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

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
  ctx.beginPath();
  ctx.moveTo(0, H - fH);
  ctx.lineTo(W, H - fH);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1;
  ctx.stroke();

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

export function buildHuellaV2VisualParams(meta: HuellaV2Meta): HuellaV2VisualParams {
  const charCount = meta.charCount ?? meta.content?.length ?? 0;
  const submitHour = meta.submitHour ?? 12;
  const formato = meta.format ?? 'texto';
  const family = chooseResonanceFamily(meta);
  const p = buildResonancePalette(meta, family);
  const palette = [p.dominant, p.secondaryA, p.secondaryB, p.accent, p.cream];
  const seed = seedFn(meta.storyId);
  const anguloBase = (submitHour / 23 - 0.5) * 20;
  const budget = ribbonBudget(meta, family);
  const ribbonCount = budget.thick + budget.thin;
  const { palabras } = buildPaletteFromMeta(meta);
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;
  const resonanceOrientation = meta.orientation ?? inferResonanceOrientation(w, h);

  return {
    version: 1,
    seed,
    format: formato,
    palette,
    wordHints: palabras.slice(0, 5),
    ribbonCount,
    anguloBase,
    charCount,
    submitHour,
    resonanceFamily: family,
    resonanceOrientation,
  };
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
  resonanceFamily: ResonanceFamily;
  resonanceOrientation: ResonanceOrientation;
};

export function getHuellaV2DrawStats(meta: HuellaV2Meta): HuellaV2Stats {
  const charCount = meta.charCount ?? meta.content?.length ?? 0;
  const submitHour = meta.submitHour ?? 12;
  const { palabras } = buildPaletteFromMeta(meta);
  const params = buildHuellaV2VisualParams(meta);
  const numLineasSvg = Math.floor(40 + (charCount / 9000) * 36);
  const anguloBaseSvg = (submitHour / 23 - 0.5) * 24;
  const w = meta.width ?? 400;
  const h = meta.height ?? 500;
  return {
    storyId: meta.storyId,
    palabrasPreview: palabras.slice(0, 5).join(', ') + (palabras.length > 5 ? ' …' : ''),
    numColores: params.palette.length,
    numLineas: params.ribbonCount,
    anguloBase: params.anguloBase,
    numLineasSvg,
    anguloBaseSvg,
    seed: params.seed,
    resonanceFamily: params.resonanceFamily ?? chooseResonanceFamily(meta),
    resonanceOrientation: params.resonanceOrientation ?? inferResonanceOrientation(w, h),
  };
}

export function drawHuellaV2OnCanvas(ctx: CanvasRenderingContext2D, meta: HuellaV2Meta): string[] {
  const {
    embedSiteFooter,
    footerAt,
    embedStoryTitle,
    embedFormatLabel,
    embedPublicUrl,
  } = meta;

  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const family = chooseResonanceFamily(meta);
  const orientation = meta.orientation ?? inferResonanceOrientation(W, H);
  const pal = buildResonancePalette(meta, family);
  const paletteArr = [pal.dominant, pal.secondaryA, pal.secondaryB, pal.accent, pal.cream];
  const S = seedFn(meta.storyId);

  const contentFrac =
    embedSiteFooter && (embedStoryTitle?.trim() || embedFormatLabel?.trim()) ? 0.14 : embedSiteFooter ? 0.1 : 0;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = HUELLA_V2_BG;
  ctx.fillRect(0, 0, W, H);

  drawOrientedRibbonField(ctx, W, H, orientation, family, meta, pal, S, contentFrac);

  if (embedSiteFooter) {
    drawHuellaSiteFooter(ctx, footerAt ?? new Date(), embedStoryTitle, embedFormatLabel, embedPublicUrl);
  }

  return paletteArr;
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
  const metaFor: HuellaV2Meta = { storyId, content: texto, format, charCount, submitHour, width, height };
  const family = chooseResonanceFamily(metaFor);
  const pal = buildResonancePalette(metaFor, family);
  const S = seedFn(storyId);
  const rnd = (i: number) => seededRnd(S, i);
  const budget = ribbonBudget(metaFor, family);
  const colors = [pal.dominant, pal.secondaryA, pal.secondaryB, pal.cream, pal.accent];
  let paths = '';
  const n = Math.min(64, budget.thick + Math.min(48, Math.floor(budget.thin / 2)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / Math.max(1, n);
    const x0 = width * (0.05 + t * 0.9) + (rnd(i * 7) - 0.5) * width * 0.08;
    const wob = width * (0.03 + rnd(i * 11) * 0.08);
    const y0 = -height * 0.05;
    const y1 = height * 1.05;
    const cx1 = x0 - wob + (rnd(i * 13) - 0.5) * width * 0.06;
    const cy1 = height * (0.25 + rnd(i * 17) * 0.15);
    const cx2 = x0 + wob + (rnd(i * 19) - 0.5) * width * 0.06;
    const cy2 = height * (0.6 + rnd(i * 23) * 0.15);
    const col = colors[i % colors.length]!;
    const op = family === 'soft-ribbons' ? 0.12 + rnd(i * 29) * 0.2 : 0.16 + rnd(i * 29) * 0.26;
    const sw = family === 'soft-ribbons' ? 10 + rnd(i * 31) * 22 : 6 + rnd(i * 31) * 20;
    paths += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${cx2.toFixed(1)} ${cy2.toFixed(1)} ${(x0 + wob * 0.8).toFixed(1)} ${y1.toFixed(1)}" stroke="${col}" stroke-width="${sw.toFixed(1)}" fill="none" opacity="${op.toFixed(2)}" stroke-linecap="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${HUELLA_V2_BG}"/>${paths}</svg>`;
}

export const generateHuella = generateHuellaSvg;
