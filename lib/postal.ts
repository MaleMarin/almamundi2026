/**
 * Postales: generar PNG con plantilla fija (OG image).
 * Siempre incluye: Alias + fecha + AlmaMundi.org + "No modificar. Mantener autoría."
 */

const W = 1200;
const H = 630;
const BG = '#E0E5EC';
const TEXT_MAIN = '#4A5568';
const ACCENT = '#ff4500';

export async function generatePostalPNG(alias: string, fecha: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d not available');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const pad = 80;
  let y = pad + 60;

  ctx.fillStyle = TEXT_MAIN;
  ctx.font = '400 48px "Avenir Light", Avenir, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(alias || '—', W / 2, y);
  y += 72;

  ctx.font = '400 36px "Avenir Light", Avenir, sans-serif';
  ctx.fillText(fecha || '—', W / 2, y);
  y += 100;

  ctx.fillStyle = ACCENT;
  ctx.font = '600 42px "Avenir Light", Avenir, sans-serif';
  ctx.fillText('AlmaMundi.org', W / 2, y);
  y += 80;

  ctx.fillStyle = TEXT_MAIN;
  ctx.font = '400 28px "Avenir Light", Avenir, sans-serif';
  ctx.fillText('No modificar. Mantener autoría.', W / 2, y);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    );
  });
}
