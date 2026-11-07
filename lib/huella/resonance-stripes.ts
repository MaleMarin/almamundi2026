/**
 * Cintas de colores (estilo Gene Davis, metodología final de exp/cintas-v2).
 * Se calculan sin modelo: léxico, colores dichos en el relato y colores de la foto.
 */

import type { AlmaLocale } from '@/lib/i18n/locale';
import { canvasFontFamily } from '@/lib/typography';
import { displayCountryName } from '@/lib/i18n/country-name';
import { formatLongDate } from '@/lib/i18n/locale';
import type { VadTriple } from '@/lib/huella/vad-color';
import { cintasSinModelo } from '@/lib/cintas-v2/sin-modelo';

export const RESONANCE_BG = '#F7F4EE';
export const RESONANCE_EXPORT_PX = 1080;
export const RESONANCE_FOOTER_SITE = 'almamundi.org';
const FOOTER_INK = '#1A1916';

export type ResonancePieceFooter = {
  at: Date;
  title?: string;
  city?: string;
  country?: string;
  locale: AlmaLocale;
};

export type DrawVadResonanceArgs = {
  storyId: string;
  text: string;
  locale: AlmaLocale;
  footer?: ResonancePieceFooter;
  /** Si no hay `footer`, pinta solo fecha + sitio (compatibilidad). */
  footerAt?: Date;
  /**
   * Promedio de resonancia (cinta del eco). No cambia las palabras del relato:
   * solo acerca poco a poco el color. Ausente = cinta del día de publicar.
   */
  ecoVad?: (VadTriple & { n: number }) | null;
  /** Franjas ya calculadas en el servidor (p. ej. con la transcripción de un audio o video). */
  units?: { hex: string; width: number }[] | null;
  /** Colores medidos de una foto (hex), si los hay. */
  coloresImagen?: string[];
};

/** Valida franjas guardadas (hex y ancho) antes de dibujarlas. */
/** Anchos en px sobre 1080: una franja ancha (más de 200) es válida. */
export function franjasValidas(value: unknown): { hex: string; width: number }[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 400) return null;
  const out: { hex: string; width: number }[] = [];
  for (const item of value) {
    const hex = (item as { hex?: unknown })?.hex;
    const width = Number((item as { width?: unknown })?.width);
    if (typeof hex !== 'string' || hex.length > 40 || !Number.isFinite(width) || width <= 0 || width > 1080) return null;
    out.push({ hex, width });
  }
  return out;
}

function truncateCanvasLine(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  const ell = '…';
  let t = text.trim();
  while (t.length > 0 && ctx.measureText(t + ell).width > maxW) {
    t = t.slice(0, -1);
  }
  return t ? t + ell : ell;
}

/** Mayúscula de la primera letra, solo al pintar. El texto guardado no cambia. */
function displayInitialCapital(value: string, locale: AlmaLocale): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toLocaleUpperCase(locale) + trimmed.slice(1);
}

function footerFontStack(): string {
  return canvasFontFamily();
}

/** Tamaños del pie en el PNG de 1080. En otros anchos se escalan con la misma proporción. */
function footerMetrics(W: number, hasTitle: boolean) {
  const scale = W / RESONANCE_EXPORT_PX;
  const padX = Math.max(12, Math.round(64 * scale));
  const padBottom = Math.max(16, Math.round(48 * scale));
  const padTop = Math.max(16, Math.round(40 * scale));
  const titlePx = Math.max(1, Math.round(44 * scale));
  const metaPx = Math.max(1, Math.round(28 * scale));
  const sitePx = Math.max(1, Math.round(24 * scale));
  const gap = Math.max(1, Math.round(16 * scale));
  const titleBlock = hasTitle ? titlePx + gap : 0;
  const height = padTop + titleBlock + metaPx + gap + sitePx + padBottom;
  return { padX, padBottom, padTop, titlePx, metaPx, sitePx, gap, height };
}

function drawResonancePieceFooter(
  ctx: CanvasRenderingContext2D,
  fieldH: number,
  footer: ResonancePieceFooter
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const title = displayInitialCapital(footer.title ?? '', footer.locale);
  const m = footerMetrics(W, Boolean(title));
  const maxW = W - m.padX * 2;
  const city = displayInitialCapital(footer.city ?? '', footer.locale);
  const country = displayCountryName(footer.country, footer.locale);
  const place = [city, country].filter(Boolean).join(', ');
  const date = formatLongDate(footer.at, footer.locale);
  const meta = place ? `${place} · ${date}` : date;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = RESONANCE_BG;
  ctx.fillRect(0, fieldH, W, H - fieldH);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, fieldH);
  ctx.lineTo(W, fieldH);
  ctx.stroke();

  ctx.fillStyle = FOOTER_INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const fontStack = footerFontStack();
  let y = fieldH + m.padTop;
  if (title) {
    y += m.titlePx;
    ctx.font = `600 ${m.titlePx}px ${fontStack}`;
    ctx.fillText(truncateCanvasLine(ctx, title, maxW), m.padX, y);
    y += m.gap;
  }
  y += m.metaPx;
  ctx.font = `500 ${m.metaPx}px ${fontStack}`;
  ctx.fillText(truncateCanvasLine(ctx, meta, maxW), m.padX, y);
  y += m.gap + m.sitePx;
  ctx.font = `500 ${m.sitePx}px ${fontStack}`;
  ctx.fillText(RESONANCE_FOOTER_SITE, m.padX, y);
  ctx.restore();
}

/** Franjas de la imagen de cintas (hex y ancho en px, suman 1080), sin dibujar. Sirve en el servidor. */
export function resonanceStripeUnits(args: {
  storyId: string;
  text: string;
  locale: AlmaLocale;
  coloresImagen?: string[];
}): { hex: string; width: number }[] {
  return cintasSinModelo({ id: args.storyId, texto: args.text, locale: args.locale, coloresImagen: args.coloresImagen });
}

export function drawVadResonanceOnCanvas(ctx: CanvasRenderingContext2D, args: DrawVadResonanceArgs): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const units =
    franjasValidas(args.units) ??
    cintasSinModelo({ id: args.storyId, texto: args.text, locale: args.locale, coloresImagen: args.coloresImagen });

  ctx.imageSmoothingEnabled = false;
  (ctx as CanvasRenderingContext2D & { webkitImageSmoothingEnabled?: boolean }).webkitImageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = RESONANCE_BG;
  ctx.fillRect(0, 0, W, H);

  const footer: ResonancePieceFooter | null = args.footer
    ? args.footer
    : args.footerAt
      ? { at: args.footerAt, locale: args.locale }
      : null;
  const footerH = footer ? footerMetrics(W, Boolean(footer.title?.trim())).height : 0;
  const fieldH = H - footerH;

  // Una sola composición a todo el ancho, sin repetir el patrón.
  const total = units.reduce((s, u) => s + u.width, 0) || 1;
  let acumulado = 0;
  for (const unit of units) {
    const x0 = Math.round((acumulado / total) * W);
    acumulado += unit.width;
    const x1 = Math.round((acumulado / total) * W);
    if (x1 <= x0) continue;
    ctx.fillStyle = unit.hex;
    ctx.fillRect(x0, 0, x1 - x0, fieldH);
  }

  if (footer) drawResonancePieceFooter(ctx, fieldH, footer);
}
