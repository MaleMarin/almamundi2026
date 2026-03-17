#!/usr/bin/env node
/**
 * Descarga el vídeo de la Tierra girando desde NASA SVS y lo guarda en public/.
 * Uso: node scripts/download-nasa-globe-video.mjs --1080   (el del viernes: SVS 5570, 1080p60)
 *      node scripts/download-nasa-globe-video.mjs --cloudy (SVS 3640)
 *      node scripts/download-nasa-globe-video.mjs --blue   (SVS 3639 Blue Marble)
 *
 * NASA SVS 5570: Spinning Earth (nubes, atmósfera, luces noche) 1920×1080 60fps → earth-1080p60.mp4
 * NASA SVS 3640: Cloudy Galileo, 1280x720 60fps
 * NASA SVS 3639: Blue Marble, 1280x720 30/60fps
 */

import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { get } from 'https';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const NASA_VIDEOS = {
  1080: {
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005570/Earth_wAtmos_spin_02_1080p60.mp4',
    label: 'SVS 5570 - Spinning Earth (nubes, atmósfera, luces), 1920×1080 60fps',
    out: 'earth-1080p60.mp4',
  },
  cloudy: {
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003640/phytoClouds_60fps.mp4',
    label: 'SVS 3640 - Tierra con nubes (Cloudy Galileo), 60fps',
    out: 'earth-globe-nasa.mp4',
  },
  blue: {
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003639/phytoBlue_60fps.mp4',
    label: 'SVS 3639 - Blue Marble, 60fps',
    out: 'earth-globe-nasa.mp4',
  },
  blue30: {
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003639/phytoBlue_30fps.mp4',
    label: 'SVS 3639 - Blue Marble, 30fps',
    out: 'earth-globe-nasa.mp4',
  },
};

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, outPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      const file = createWriteStream(outPath);
      res.pipe(file);
      let len = 0;
      res.on('data', (c) => { len += c.length; });
      file.on('finish', () => {
        file.close();
        resolve(len);
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const use1080 = args.includes('--1080');
  const useCloudy = args.includes('--cloudy');
  const useBlue = args.includes('--blue');
  const useBlue30 = args.includes('--blue30');
  const key = use1080 ? '1080' : useCloudy ? 'cloudy' : useBlue30 ? 'blue30' : useBlue ? 'blue' : '1080';
  const { url, label, out } = NASA_VIDEOS[key];
  const outPath = join(PUBLIC, out);

  console.log('NASA SVS — Descargando vídeo del globo terrestre');
  console.log('  ', label);
  console.log('  ', url);
  console.log('  →', outPath);

  await mkdir(PUBLIC, { recursive: true });
  const bytes = await download(url, outPath);
  console.log('  OK:', (bytes / 1024 / 1024).toFixed(2), 'MB');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
