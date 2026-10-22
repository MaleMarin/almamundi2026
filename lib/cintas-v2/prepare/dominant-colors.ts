import sharp from 'sharp';
import { rgbHex } from '@/lib/cintas-v2/palette';

type Pixel = [number, number, number];

function lum(p: Pixel): number {
  return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
}

function dist2(a: Pixel, b: Pixel): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function kmeans(pixels: Pixel[], k: number): Array<{ color: Pixel; n: number }> {
  if (pixels.length === 0) return [];
  const kk = Math.max(1, Math.min(k, pixels.length));
  const sorted = pixels
    .map((p, i) => ({ p, i }))
    .sort((a, b) => lum(a.p) - lum(b.p) || a.i - b.i);
  const centers: Pixel[] = [];
  for (let i = 0; i < kk; i++) {
    const idx = Math.min(sorted.length - 1, Math.floor(((i + 0.5) / kk) * sorted.length));
    const p = sorted[idx]!.p;
    centers.push([p[0], p[1], p[2]]);
  }
  const counts = new Array<number>(kk).fill(0);
  for (let iter = 0; iter < 10; iter++) {
    const sumas: Pixel[] = centers.map(() => [0, 0, 0]);
    counts.fill(0);
    for (const p of pixels) {
      let best = 0;
      let score = Number.POSITIVE_INFINITY;
      for (let c = 0; c < centers.length; c++) {
        const d = dist2(p, centers[c]!);
        if (d < score) {
          score = d;
          best = c;
        }
      }
      sumas[best]![0] += p[0];
      sumas[best]![1] += p[1];
      sumas[best]![2] += p[2];
      counts[best] += 1;
    }
    for (let c = 0; c < centers.length; c++) {
      if (counts[c]! === 0) continue;
      centers[c] = [
        sumas[c]![0] / counts[c]!,
        sumas[c]![1] / counts[c]!,
        sumas[c]![2] / counts[c]!,
      ];
    }
  }
  return centers
    .map((color, i) => ({ color, n: counts[i]! }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);
}

/** Cinco colores dominantes, en local, sin identificar a nadie. */
export async function coloresDominantes(input: Buffer, n = 5): Promise<string[]> {
  const { data } = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(40, 40, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels: Pixel[] = [];
  for (let i = 0; i < data.length; i += 3) {
    pixels.push([data[i]!, data[i + 1]!, data[i + 2]!]);
  }
  const grupos = kmeans(pixels, Math.max(n, 6));
  const elegidos: string[] = [];
  for (const g of grupos) {
    const hex = rgbHex(g.color[0], g.color[1], g.color[2]);
    const lejos = elegidos.every((prev) => {
      const [r, gg, b] = [parseInt(prev.slice(1, 3), 16), parseInt(prev.slice(3, 5), 16), parseInt(prev.slice(5, 7), 16)];
      return dist2(g.color, [r, gg, b]) > 28 * 28;
    });
    if (!lejos) continue;
    elegidos.push(hex);
    if (elegidos.length === n) break;
  }
  if (elegidos.length < n) {
    for (const g of grupos) {
      const hex = rgbHex(g.color[0], g.color[1], g.color[2]);
      if (!elegidos.includes(hex)) elegidos.push(hex);
      if (elegidos.length === n) break;
    }
  }
  return elegidos;
}
