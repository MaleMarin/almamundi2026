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
  /** Franja inferior con URL y fecha (modal de confirmación / descarga). */
  embedSiteFooter?: boolean;
  /** Fecha en la franja; por defecto “ahora” si `embedSiteFooter` es true. */
  footerAt?: Date;
  /** Título de la historia en la franja del PNG (sustituye texto genérico de “recuerdo” / ID). */
  embedStoryTitle?: string;
};

export const HUELLA_V2_BG = '#F0EFE9';

export const HUELLA_V2_SITE_DISPLAY = 'www.almamundi.org';

/** Palabras significativas que forman la paleta (spec modal confirmación). */
export const HUELLA_V2_MAX_PALABRAS = 14;

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

export function palabraAColor(palabra: string): string {
  const vocales = (palabra.match(/[aeiouáéíóú]/gi) || []).length;
  const charSum = [...palabra].reduce((s, c) => s + c.charCodeAt(0), 0);
  const hue = charSum % 360;
  const sat = Math.min(100, 65 + (vocales / palabra.length) * 35);
  const lit = Math.max(
    22,
    Math.min(58, 28 + ((palabra.length - vocales) / palabra.length) * 32),
  );
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
  const h = (+m[1] + Math.floor(seededRnd(seed, i * 7 + 1) * 18) - 9 + 360) % 360;
  const s = Math.min(100, +m[2] + 22 + Math.floor(seededRnd(seed, i * 7 + 2) * 15));
  const l = Math.max(18, Math.min(60, +m[3] + Math.floor(seededRnd(seed, i * 7 + 3) * 10) - 5));
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
  /** Líneas dibujadas en canvas (Bézier, alta densidad). */
  numLineas: number;
  anguloBase: number;
  /** Líneas en `generateHuella` / `generateHuellaSvg` (rectas, 80–200). */
  numLineasSvg: number;
  /** Ángulo base del SVG (×28), distinto del canvas (×22). */
  anguloBaseSvg: number;
  seed: number;
};

export function getHuellaV2DrawStats(meta: HuellaV2Meta): HuellaV2Stats {
  const charCount = meta.charCount ?? (meta.content?.length ?? 0);
  const submitHour = meta.submitHour ?? 12;
  const { palabras } = buildPaletteFromMeta(meta);
  const numLineas = Math.floor(150 + (charCount / 4500) * 150);
  const anguloBase = (submitHour / 23 - 0.5) * 22;
  const numLineasSvg = Math.floor(80 + (charCount / 4500) * 120);
  const anguloBaseSvg = (submitHour / 23 - 0.5) * 28;
  return {
    storyId: meta.storyId,
    palabrasPreview:
      palabras.slice(0, 5).join(', ') + (palabras.length > 5 ? ' …' : ''),
    numColores: palabras.length,
    numLineas,
    anguloBase,
    numLineasSvg,
    anguloBaseSvg,
    seed: seedFn(meta.storyId),
  };
}

/**
 * Dibuja la huella v2 en un canvas (usa canvas.width / canvas.height).
 * @returns paleta HSL usada (strings).
 */
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

/** Una línea; recorta con … si no cabe. */
function truncateCanvasLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): string {
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
  storyTitle?: string
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const title = storyTitle?.trim();
  const hasTitle = Boolean(title);
  /** Franja baja: menos altura para no tapar el dibujo (“menos vidrio” visual). */
  const fH = H * (hasTitle ? 0.125 : 0.085);
  const fechaCorta = `${at.getDate()} ${MESES_CORTO[at.getMonth()]} ${at.getFullYear()}`;
  const metaLine = `${HUELLA_V2_SITE_DISPLAY} · ${fechaCorta}`;

  ctx.save();
  /* Sólido: sin capa semitransparente tipo “glass” sobre los trazos */
  ctx.globalAlpha = 1;
  ctx.fillStyle = HUELLA_V2_BG;
  ctx.fillRect(0, H - fH, W, fH);
  ctx.beginPath();
  ctx.moveTo(0, H - fH);
  ctx.lineTo(W, H - fH);
  ctx.strokeStyle = 'rgba(20,29,38,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bandTop = H - fH;
  const maxW = W * 0.9;

  if (hasTitle && title) {
    const titlePx = Math.max(11, Math.round(W * 0.026));
    ctx.fillStyle = '#111418';
    ctx.font = `500 ${titlePx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const lineTitle = truncateCanvasLine(ctx, title, maxW);
    ctx.fillText(lineTitle, W / 2, bandTop + fH * 0.36);

    const metaPx = Math.max(9, Math.round(W * 0.018));
    ctx.fillStyle = '#64748B';
    ctx.font = `400 ${metaPx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const lineMeta = truncateCanvasLine(ctx, metaLine, maxW);
    ctx.fillText(lineMeta, W / 2, bandTop + fH * 0.74);
  } else {
    const metaPx = Math.max(10, Math.round(W * 0.022));
    ctx.fillStyle = '#64748B';
    ctx.font = `400 ${metaPx}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const lineMeta = truncateCanvasLine(ctx, metaLine, maxW);
    ctx.fillText(lineMeta, W / 2, bandTop + fH * 0.52);
  }
  ctx.restore();
}

export function drawHuellaV2OnCanvas(ctx: CanvasRenderingContext2D, meta: HuellaV2Meta): string[] {
  const {
    storyId,
    charCount = 1000,
    submitHour = 14,
    embedSiteFooter,
    footerAt,
    embedStoryTitle,
  } = meta;
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
  const numLineas = Math.floor(150 + (charCount / 4500) * 150);
  const anguloBase = (submitHour / 23 - 0.5) * 22;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = HUELLA_V2_BG;
  ctx.fillRect(0, 0, W, H);

  const pasadas = [
    { frac: 0.3, anchoMin: 12, anchoMax: 55, opMin: 0.45, opMax: 0.75, wobble: 35 },
    { frac: 0.42, anchoMin: 3, anchoMax: 18, opMin: 0.55, opMax: 0.92, wobble: 18 },
    { frac: 0.28, anchoMin: 1, anchoMax: 7, opMin: 0.7, opMax: 1.0, wobble: 8 },
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
      const angulo = anguloBase + (rnd(ii + 300) - 0.5) * 34 + (rnd(ii + 301) - 0.5) * 10;
      const opacidad = p.opMin + rnd(ii + 400) * (p.opMax - p.opMin);
      const x = i * step + rnd(ii + 500) * step * 1.15 - W * 0.05;
      const offset = Math.tan((angulo * Math.PI) / 180) * H;
      const over = H * 0.18;
      const x1 = x - offset / 2;
      const x2 = x + offset / 2;
      const cx1 = x1 + (rnd(ii + 700) - 0.5) * p.wobble * 2;
      const cy1 = H * 0.28 + rnd(ii + 701) * H * 0.12;
      const cx2 = x2 + (rnd(ii + 702) - 0.5) * p.wobble * 2;
      const cy2 = H * 0.62 + rnd(ii + 703) * H * 0.12;

      ctx.beginPath();
      ctx.moveTo(x1, -over);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, H + over);
      ctx.strokeStyle = color;
      ctx.lineWidth = ancho;
      ctx.globalAlpha = opacidad;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  const nAcento = Math.floor(5 + rnd(9999) * 5);
  for (let i = 0; i < nAcento; i++) {
    const ii = lineIdx++;
    const ci = Math.floor(rnd(ii + 50) * paleta.length);
    const color = hslVibrate(paleta[ci]!, S, ii + 5000);
    const ancho = 30 + rnd(ii + 800) * 50;
    const angulo = anguloBase + (rnd(ii + 900) - 0.5) * 18;
    const opacidad = 0.18 + rnd(ii + 901) * 0.28;
    const x = -W * 0.1 + rnd(ii + 902) * W * 1.2;
    const offset = Math.tan((angulo * Math.PI) / 180) * H;
    const cx1 = x - offset / 3 + (rnd(ii + 903) - 0.5) * 40;
    const cx2 = x + offset / 3 + (rnd(ii + 904) - 0.5) * 40;
    ctx.beginPath();
    ctx.moveTo(x - offset / 2, -H * 0.1);
    ctx.bezierCurveTo(cx1, H * 0.32, cx2, H * 0.68, x + offset / 2, H * 1.1);
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.globalAlpha = opacidad;
    ctx.lineCap = 'butt';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (embedSiteFooter) {
    drawHuellaSiteFooter(ctx, footerAt ?? new Date(), embedStoryTitle);
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
    palabras = [...palabras, ...extraerPalabras(storyId.replace(/[-_]/g, ' '))];
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

/**
 * Alias del nombre usado en la spec (`generateHuella` → string SVG). Mismo cuerpo que `generateHuellaSvg`.
 */
export const generateHuella = generateHuellaSvg;
