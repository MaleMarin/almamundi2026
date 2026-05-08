import type { HuellaVisualParams, VisualBlock } from "@/lib/huella/types";

export const IMPRONTA_EXPORT_W = 900;
export const IMPRONTA_EXPORT_H = 1200;
const FOOTER_H = 112;

function drawBlock(
  ctx: CanvasRenderingContext2D,
  b: VisualBlock,
  ox: number,
  oy: number,
  innerW: number,
  innerH: number
) {
  const x = ox + b.x * innerW;
  const y = oy + b.y * innerH;
  const w = Math.max(6, b.w * innerW);
  const h = Math.max(6, b.h * innerH);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(b.rot);
  ctx.fillStyle = b.color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

export type BauhausExportOpts = {
  footerLine: string;
  dateLabel: string;
  /** Etiqueta de formato en el pie descargable (recuerdo AlmaMundi). */
  formatLabel?: string;
};

/**
 * Composición tipo Bauhaus: rectángulos a partir de `HuellaVisualParams`,
 * marco sobrio y franja inferior clara (sin bloque negro).
 */
export function drawImprontaBauhaus(
  ctx: CanvasRenderingContext2D,
  params: HuellaVisualParams,
  opts: BauhausExportOpts
): void {
  const W = IMPRONTA_EXPORT_W;
  const H = IMPRONTA_EXPORT_H;
  const fh = FOOTER_H;
  const cw = W;
  const ch = H - fh;

  const pageBg = "#E0E5EC";
  ctx.fillStyle = pageBg;
  ctx.fillRect(0, 0, W, H);

  const pad = 20;
  const innerW = cw - pad * 2;
  const innerH = ch - pad * 2;
  const ox = pad;
  const oy = pad;

  ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(ox - 2, oy - 2, innerW + 4, innerH + 4);

  for (const b of params.base) drawBlock(ctx, b, ox, oy, innerW, innerH);
  for (const b of params.core) drawBlock(ctx, b, ox, oy, innerW, innerH);
  for (const b of params.fragmentation) drawBlock(ctx, b, ox, oy, innerW, innerH);

  if (params.modeOverlay) {
    ctx.fillStyle = params.modeOverlay;
    ctx.fillRect(ox, oy, innerW, innerH);
  }

  ctx.strokeStyle = "rgba(255, 69, 0, 0.45)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ox, oy + innerH * 0.55);
  ctx.lineTo(ox + innerW * 0.45, oy + 10);
  ctx.stroke();

  ctx.fillStyle = pageBg;
  ctx.fillRect(0, H - fh, W, fh);
  ctx.beginPath();
  ctx.moveTo(0, H - fh);
  ctx.lineTo(W, H - fh);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#ff4500";
  ctx.font = "600 20px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("AlmaMundi", 28, H - fh / 2 - 26);

  ctx.fillStyle = "#334155";
  ctx.font = "600 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(opts.footerLine, 28, H - fh / 2 + 2);

  const fmt = opts.formatLabel?.trim();
  const sub = fmt ? `${opts.dateLabel} · ${fmt}` : opts.dateLabel;
  ctx.fillStyle = "#64748b";
  ctx.font = "500 16px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(sub, 28, H - fh / 2 + 30);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Interpretación visual", 28, H - fh / 2 + 52);
}
