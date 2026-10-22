import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { rutaFfmpegStatic } from '@/lib/cintas-v2/prepare/ffmpeg-bin';

function run(bin: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (chunk: Buffer) => {
      err += chunk.toString();
      if (err.length > 8000) err = err.slice(-8000);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(err);
      else reject(new Error(`ffmpeg terminó con código ${code}. ${err.slice(-400)}`));
    });
  });
}

export async function duracionSegundos(archivo: string): Promise<number> {
  const bin = rutaFfmpegStatic();
  const err = await new Promise<string>((resolve) => {
    const child = spawn(bin, ['-i', archivo], { stdio: ['ignore', 'ignore', 'pipe'] });
    let texto = '';
    child.stderr.on('data', (chunk: Buffer) => {
      texto += chunk.toString();
    });
    child.on('close', () => resolve(texto));
    child.on('error', () => resolve(texto));
  });
  const m = err.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) throw new Error('No pude leer la duración del archivo.');
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Saca el audio del video y 6 cuadros repartidos en el tiempo. */
export async function extraerVideo(videoPath: string, outDir: string): Promise<{ audioPath: string; cuadros: string[] }> {
  const bin = rutaFfmpegStatic();
  await mkdir(outDir, { recursive: true });
  const audioPath = join(outDir, 'audio.wav');
  await run(bin, ['-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', audioPath]);
  const duracion = await duracionSegundos(videoPath);
  const cuadros: string[] = [];
  for (let i = 0; i < 6; i++) {
    const t = Math.max(0, duracion * ((i + 0.5) / 6));
    const frame = join(outDir, `cuadro-${i + 1}.jpg`);
    await run(bin, ['-y', '-ss', t.toFixed(3), '-i', videoPath, '-frames:v', '1', '-q:v', '3', frame]);
    cuadros.push(frame);
  }
  return { audioPath, cuadros };
}
