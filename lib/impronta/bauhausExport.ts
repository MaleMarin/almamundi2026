import type { HuellaVisualParams, VisualBlock } from "@/lib/huella/types";

export const IMPRONTA_EXPORT_W = 900;
export const IMPRONTA_EXPORT_H = 1200;
const FOOTER_H = 100;

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

/**
 * Composición tipo Bauhaus: rectángulos duros a partir de `HuellaVisualParams`,
 * marco negro, franja inferior con sitio y fecha.
 */
export function drawImprontaBauhaus(
  ctx: CanvasRenderingContext2D,
  params: HuellaVisualParams,
  opts: { footerLine: string; dateLabel: string }
): void {
  const W = IMPRONTA_EXPORT_W;
  const H = IMPRONTA_EXPORT_H;
  const fh = FOOTER_H;
  const cw = W;
  const ch = H - fh;

  ctx.fillStyle = "#EDE9E0";
  ctx.fillRect(0, 0, W, H);

  const pad = 20;
  const innerW = cw - pad * 2;
  const innerH = ch - pad * 2;
  const ox = pad;
  const oy = pad;

  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 5;
  ctx.strokeRect(ox - 4, oy - 4, innerW + 8, innerH + 8);

  for (const b of params.base) drawBlock(ctx, b, ox, oy, innerW, innerH);
  for (const b of params.core) drawBlock(ctx, b, ox, oy, innerW, innerH);
  for (const b of params.fragmentation) drawBlock(ctx, b, ox, oy, innerW, innerH);

  if (params.modeOverlay) {
    ctx.fillStyle = params.modeOverlay;
    ctx.fillRect(ox, oy, innerW, innerH);
  }

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(ox, oy + innerH * 0.55);
  ctx.lineTo(ox + innerW * 0.5, oy + 8);
  ctx.stroke();

  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, H - fh, W, fh);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 24px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.footerLine, 28, H - fh / 2 - 14);

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "500 17px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(opts.dateLabel, 28, H - fh / 2 + 18);
}
