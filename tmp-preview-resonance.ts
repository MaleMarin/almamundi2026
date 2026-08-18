/**
 * Vista previa local del sistema de 100 conceptos. No forma parte del producto.
 */
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { formatHuellaImprintFooterLine } from './lib/huella/huellaV2';
import { RESONANCE_CANVAS_W, RESONANCE_CONCEPTS } from './lib/huella/resonance-concepts';
import { extractResonanceHits, drawResonanceStripes } from './lib/huella/resonance-stripes';
import { foldResonanceToken } from './lib/huella/resonance-lexicon';

const OUT_DIR = path.join(process.cwd(), 'tmp-resonance-preview');
const RECEIVED_AT = new Date('2026-08-15T17:30:00-04:00');

class BufferCanvas {
  width: number;
  height: number;
  readonly pixels: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8ClampedArray(width * height * 4);
  }

  getContext(): BufferCtx {
    return new BufferCtx(this);
  }
}

class BufferCtx {
  canvas: BufferCanvas;
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '16px sans-serif';
  textAlign: CanvasTextAlign = 'center';
  textBaseline: CanvasTextBaseline = 'middle';
  private sx = 0;
  private sy = 0;
  private px = 0;
  private py = 0;

  constructor(canvas: BufferCanvas) {
    this.canvas = canvas;
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    this.fillStyle = '#00000000';
    this.fillRect(x, y, w, h);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    const { r, g, b, a } = parseCssColor(this.fillStyle);
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.canvas.width, Math.ceil(x + w));
    const y1 = Math.min(this.canvas.height, Math.ceil(y + h));
    const px = this.canvas.pixels;
    const W = this.canvas.width;
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * W + x0) * 4;
      for (let xx = x0; xx < x1; xx++) {
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = a;
        i += 4;
      }
    }
  }

  beginPath(): void {
    this.sx = this.px;
    this.sy = this.py;
  }
  moveTo(x: number, y: number): void {
    this.px = x;
    this.py = y;
    this.sx = x;
    this.sy = y;
  }
  lineTo(x: number, y: number): void {
    this.strokeLine(this.px, this.py, x, y);
    this.px = x;
    this.py = y;
  }
  stroke(): void {
    /* lineTo already painted */
  }
  fillText(_text: string, _x: number, _y: number): void {
    /* pie: no tipografía en este preview; la franja del footer sí se pinta */
  }

  private strokeLine(x0: number, y0: number, x1: number, y1: number): void {
    const { r, g, b, a } = parseCssColor(this.strokeStyle);
    const px = this.canvas.pixels;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const x = Math.max(0, Math.min(W - 1, Math.round(x0)));
    const y = Math.max(0, Math.min(H - 1, Math.round(y0)));
    const xEnd = Math.max(0, Math.min(W - 1, Math.round(x1)));
    if (y === Math.round(y1) && x !== xEnd) {
      const from = Math.min(x, xEnd);
      const to = Math.max(x, xEnd);
      let i = (y * W + from) * 4;
      for (let xx = from; xx <= to; xx++) {
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = a;
        i += 4;
      }
    }
  }
}

function parseCssColor(input: string): { r: number; g: number; b: number; a: number } {
  const s = input.trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    if (h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: parseInt(h.slice(6, 8), 16),
      };
    }
    if (h.length === 6) {
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 255 };
    }
  }
  const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (m) {
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] == null ? 255 : Math.round(Number(m[4]) * 255),
    };
  }
  return { r: 0, g: 0, b: 0, a: 255 };
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([t, data]));
  return Buffer.concat([u32(data.length), t, data, u32(crc)]);
}

function writePng(filePath: string, width: number, height: number, rgba: Uint8ClampedArray): void {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const dest = y * (width * 4 + 1);
    raw[dest] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), dest + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  const fs = require('node:fs') as typeof import('node:fs');
  fs.writeFileSync(filePath, png);
}

const STORIES: { slug: string; title: string; text: string; storyId: string }[] = [
  {
    slug: '01-muerte-padre',
    title: 'La última tarde de mi padre',
    storyId: 'preview-padre-001',
    text: `Mi padre se murió un martes de marzo, en la misma cama donde yo nací. El funeral fue en el pueblo: luto, vecinos, el olor a tierra mojada. Yo tenía rabia y también miedo de quedarme solo. En el duelo nadie sabe qué decir. Extraño su voz cuando pedía café. Esa muerte no se va.`,
  },
  {
    slug: '02-infancia-playa',
    title: 'Veranos en la orilla',
    storyId: 'preview-playa-002',
    text: `De chico pasaba la infancia en la playa de mis abuelos. El sol, la arena, las olas del mar, la risa de mis hermanos. Mi madre nos gritaba desde la orilla y nosotros corríamos felices, con la alegría de no tener escuela. Aún siento la brisa y el sabor a sal. Era un verano eterno.`,
  },
  {
    slug: '03-migracion-exilio',
    title: 'Me fui y no pude volver',
    storyId: 'preview-exilio-003',
    text: `Emigré a los veinte. Cruzar la frontera con una maleta y el miedo en la boca. El exilio no es un viaje: es quedarse sin casa, sin idioma de todos los días, sin el barrio. Soy inmigrante y a veces desterrado. Extraño el pueblo. Un día quiero el regreso, aunque la aduana me trate como a un extraño.`,
  },
  {
    slug: '04-musica-abuela',
    title: 'La guitarra de mi abuela',
    storyId: 'preview-abuela-004',
    text: `Mi abuela cantaba en la cocina. Una canción vieja, la misma melodía cada tarde, mientras el guiso. Yo aprendí música en su regazo: guitarra desafinada, palmas, esa voz. Cuando ella se fue, la casa se quedó sin canto. Aún pongo su disco y bailo un poco, como si ella estuviera.`,
  },
  {
    slug: '05-dos-lineas',
    title: 'Dos líneas',
    storyId: 'preview-corto-005',
    text: `Te extraño esta noche.\nNada más.`,
  },
];

const SAME_TEXT = STORIES[0]!.text;
const PT_TEXT = `Meu pai morreu numa terça-feira. O funeral foi no povoado, com vizinhos e terra molhada. Sinto saudade da voz dele pedindo café. A morte não vai embora. Na praia da infância eu era feliz com meus irmãos e o mar.`;

function uniqueLexiconStats() {
  const src = require('node:fs').readFileSync(
    path.join(process.cwd(), 'lib/huella/resonance-lexicon.ts'),
    'utf8'
  ) as string;
  const wordArrays = [...src.matchAll(/words:\s*\[([^\]]+)\]/g)].map((m) => m[1]!);
  const all: string[] = [];
  for (const block of wordArrays) {
    for (const m of block.matchAll(/'([^']+)'/g)) all.push(m[1]!);
  }
  const folded = all.map((w) => foldResonanceToken(w)).filter(Boolean);
  const unique = new Set(folded);
  const phrases = folded.filter((w) => w.includes(' '));
  const singles = folded.filter((w) => !w.includes(' '));
  return {
    rawEntries: all.length,
    uniqueFolded: unique.size,
    uniquePhrases: new Set(phrases).size,
    uniqueSingles: new Set(singles).size,
    concepts: RESONANCE_CONCEPTS.length,
  };
}

async function renderOne(slug: string, storyId: string, text: string): Promise<string> {
  const hits = extractResonanceHits(text);
  const canvas = new BufferCanvas(RESONANCE_CANVAS_W, RESONANCE_CANVAS_W);
  const ctx = canvas.getContext();
  drawResonanceStripes(ctx as unknown as CanvasRenderingContext2D, {
    storyId,
    hits,
    footerLine: formatHuellaImprintFooterLine(RECEIVED_AT),
  });
  const file = path.join(OUT_DIR, `${slug}.png`);
  writePng(file, canvas.width, canvas.height, canvas.pixels);
  return file;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const report: unknown[] = [];

  for (const s of STORIES) {
    const hits = extractResonanceHits(s.text);
    const file = await renderOne(s.slug, s.storyId, s.text);
    report.push({
      slug: s.slug,
      title: s.title,
      storyId: s.storyId,
      file,
      hits: hits.map((h) => ({ id: h.concept.id, name: h.concept.name, hex: h.concept.hex, count: h.count })),
    });
  }

  const a = await renderOne('06-mismo-texto-id-A', 'preview-padre-AAA', SAME_TEXT);
  const b = await renderOne('07-mismo-texto-id-B', 'preview-padre-BBB', SAME_TEXT);
  const hitsSame = extractResonanceHits(SAME_TEXT).map((h) => ({
    id: h.concept.id,
    name: h.concept.name,
    hex: h.concept.hex,
    count: h.count,
  }));

  const ptHits = extractResonanceHits(PT_TEXT).map((h) => ({
    id: h.concept.id,
    name: h.concept.name,
    hex: h.concept.hex,
    count: h.count,
  }));

  const regionalProbe = [
    'guagua',
    'platicar',
    'pololo',
    'polola',
    'pibe',
    'chamaco',
    'chavo',
    'chamo',
    'cipote',
    'patojo',
    'wawa',
    'chévere',
    'chevere',
    'bacán',
    'bacan',
    'laburo',
    'plata',
    'chacra',
    'pobla',
    'compa',
    'nona',
    'cesante',
    'corso',
    'quechua',
    'guarani',
    'parce',
    'mae',
    'tuanis',
    'cuate',
    'carnal',
    'micro',
    'camión',
    'camion',
  ].map((w) => ({ word: w, hits: extractResonanceHits(w).map((h) => h.concept.name) }));

  const out = {
    lexicon: uniqueLexiconStats(),
    stories: report,
    sameTextDifferentIds: { hits: hitsSame, files: [a, b] },
    portuguese: { text: PT_TEXT, hits: ptHits },
    regionalProbe,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
