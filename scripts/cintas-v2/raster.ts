import sharp from 'sharp';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { drawVadResonanceOnCanvas } from '@/lib/huella/resonance-stripes';
import { pintarBandas } from '@/lib/cintas-v2/compose/render';
import type { Banda } from '@/lib/cintas-v2/compose/layout';
import { LADO, metricasPie, svgPie } from '@/scripts/cintas-v2/footer';

export type Pie = {
  titulo: string;
  ciudad: string;
  pais: string;
  at: Date;
  locale: AlmaLocale;
};

function parseCssColor(style: string): [number, number, number, number] {
  const s = style.trim().toLowerCase();
  if (s === '#000000' || s === '#000') return [0, 0, 0, 255];
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    const n = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const v = Number.parseInt(n, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 255];
  }
  const m = s.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/);
  if (m) {
    const h = Number(m[1]) / 360;
    const sat = Number(m[2]) / 100;
    const l = Number(m[3]) / 100;
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    if (sat === 0) {
      const g = Math.round(l * 255);
      return [g, g, g, 255];
    }
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
      255,
    ];
  }
  return [247, 244, 238, 255];
}

function lienzoActual(): CanvasRenderingContext2D {
  const rgba = Buffer.alloc(LADO * LADO * 4);
  let fill = '#F7F4EE';
  const fillRect = (x: number, y: number, w: number, h: number) => {
    const [r, g, b, a] = parseCssColor(fill);
    if (a === 0) return;
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(LADO, x0 + Math.max(0, Math.round(w)));
    const y1 = Math.min(LADO, y0 + Math.max(0, Math.round(h)));
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * LADO + x0) * 4;
      for (let xx = x0; xx < x1; xx++) {
        rgba[i] = r;
        rgba[i + 1] = g;
        rgba[i + 2] = b;
        rgba[i + 3] = 255;
        i += 4;
      }
    }
  };
  const ctx: Record<string, unknown> = {
    canvas: { width: LADO, height: LADO },
    imageSmoothingEnabled: false,
    webkitImageSmoothingEnabled: false,
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    clearRect: fillRect,
    fillRect,
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillText() {},
    measureText: (t: string) => ({ width: String(t).length * 8 }),
  };
  Object.defineProperty(ctx, 'fillStyle', {
    get() {
      return fill;
    },
    set(v: string) {
      fill = String(v);
    },
  });
  (ctx as { rgba?: Buffer }).rgba = rgba;
  return ctx as unknown as CanvasRenderingContext2D & { rgba: Buffer };
}

async function conPie(rgba: Buffer, pie: Pie): Promise<Buffer> {
  const alto = metricasPie(LADO, Boolean(pie.titulo.trim())).height;
  return sharp(rgba, { raw: { width: LADO, height: LADO, channels: 4 } })
    .composite([{ input: svgPie(pie), top: LADO - alto, left: 0 }])
    .png()
    .toBuffer();
}

export async function pngActual(params: { id: string; texto: string; pie: Pie }): Promise<Buffer> {
  const ctx = lienzoActual();
  drawVadResonanceOnCanvas(ctx, {
    storyId: params.id,
    text: params.texto,
    locale: params.pie.locale,
    footer: {
      at: params.pie.at,
      title: params.pie.titulo,
      city: params.pie.ciudad,
      country: params.pie.pais,
      locale: params.pie.locale,
    },
  });
  return conPie(ctx.rgba, params.pie);
}

export async function pngV2(bandas: Banda[], pie: Pie): Promise<Buffer> {
  const alto = metricasPie(LADO, Boolean(pie.titulo.trim())).height;
  const rgba = pintarBandas(bandas, LADO - alto, LADO);
  return conPie(rgba, pie);
}
