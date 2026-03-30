/**
 * Tarjeta cuadrada estilo vidrio esmerilado (~15×15 cm a 96 dpi ≈ 567 px;
 * exportamos 1200 px para nitidez al compartir / imprimir).
 * Solo ejecutar en el cliente (canvas).
 */


function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let yy = y;
  for (let n = 0; n < words.length; n++) {
    const test = line ? `${line} ${words[n]}` : words[n];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = words[n];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lineHeight;
}

function clipRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export type ExhibitionShareCardOptions = {
  imageUrl: string;
  quote: string;
  authorName: string;
  storyTitle: string;
  exhibitionLabel: string;
  qrDataUrl: string;
};

const EXPORT_PX = 1200;

export async function renderExhibitionShareCardPng(
  opts: ExhibitionShareCardOptions
): Promise<Blob> {
  const W = EXPORT_PX;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = W;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');

  const g = ctx.createLinearGradient(0, 0, W, W);
  g.addColorStop(0, '#eef1f4');
  g.addColorStop(0.45, '#dce3ea');
  g.addColorStop(1, '#cfd8e0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, W);

  const pad = 48;
  const photoY = pad + 28;
  const photoH = Math.floor(W * 0.4);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(() => reject(new Error('timeout')), 12000);
      img.onload = () => {
        window.clearTimeout(t);
        resolve();
      };
      img.onerror = () => {
        window.clearTimeout(t);
        reject(new Error('img'));
      };
      img.src = opts.imageUrl;
    });
    ctx.save();
    clipRoundRect(ctx, pad, photoY, W - pad * 2, photoH, 22);
    ctx.clip();
    ctx.drawImage(img, pad, photoY, W - pad * 2, photoH);
    ctx.restore();
  } catch {
    ctx.fillStyle = 'rgba(30, 35, 45, 0.18)';
    clipRoundRect(ctx, pad, photoY, W - pad * 2, photoH, 22);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  clipRoundRect(ctx, pad, photoY, W - pad * 2, photoH, 22);
  ctx.fill();

  const q =
    opts.quote.length > 280 ? `${opts.quote.slice(0, 277).trim()}…` : opts.quote;
  ctx.fillStyle = 'rgba(18, 22, 32, 0.92)';
  ctx.font = 'italic 30px Georgia, "Times New Roman", serif';
  const quoteBlock = `«${q}»`;
  const textStartY = photoY + photoH + 44;
  const bottomReserve = 260;
  const maxQuoteY = W - bottomReserve;
  let lineY = textStartY;
  const words = quoteBlock.split(/\s+/).filter(Boolean);
  let line = '';
  const maxW = W - pad * 2;
  const lh = 38;
  for (let n = 0; n < words.length; n++) {
    const test = line ? `${line} ${words[n]}` : words[n];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, pad, lineY);
      line = words[n];
      lineY += lh;
      if (lineY > maxQuoteY) break;
    } else {
      line = test;
    }
  }
  if (line && lineY <= maxQuoteY) ctx.fillText(line, pad, lineY);

  ctx.fillStyle = 'rgba(25, 30, 40, 0.95)';
  ctx.font = '600 26px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`— ${opts.authorName}`, pad, Math.min(lineY + lh + 8, W - 220));

  ctx.fillStyle = 'rgba(45, 50, 62, 0.88)';
  ctx.font = '600 22px ui-sans-serif, system-ui, sans-serif';
  const title =
    opts.storyTitle.length > 80
      ? `${opts.storyTitle.slice(0, 77)}…`
      : opts.storyTitle;
  wrapText(ctx, title, pad, Math.min(lineY + lh + 52, W - 200), maxW, 30);

  const qr = new Image();
  await new Promise<void>((resolve, reject) => {
    qr.onload = () => resolve();
    qr.onerror = () => reject(new Error('qr'));
    qr.src = opts.qrDataUrl;
  });
  const qrSize = 200;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const qx = W - pad - qrSize - 8;
  const qy = W - pad - qrSize - 52;
  clipRoundRect(ctx, qx - 6, qy - 6, qrSize + 12, qrSize + 12, 12);
  ctx.fill();
  ctx.restore();
  ctx.drawImage(qr, qx, qy, qrSize, qrSize);

  ctx.save();
  ctx.translate(W / 2, W / 2);
  ctx.rotate(-Math.PI / 5.5);
  ctx.globalAlpha = 0.06;
  ctx.font = 'bold 52px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#1a2030';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const wm = `AlmaMundi · ${opts.exhibitionLabel}`;
  ctx.fillText(wm.length > 42 ? `${wm.slice(0, 39)}…` : wm, 0, 0);
  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.font = '13px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(55, 60, 72, 0.75)';
  ctx.fillText('Escanea para volver a la historia en su contexto original.', pad, W - pad - 18);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('blob'))),
      'image/png',
      0.92
    );
  });
}
