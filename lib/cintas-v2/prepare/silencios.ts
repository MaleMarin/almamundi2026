import { spawn } from 'node:child_process';
import type { SilencioMarca } from '@/lib/cintas-v2/compose/layout';
import { rutaFfmpegStatic } from '@/lib/cintas-v2/prepare/ffmpeg-bin';

export type SilenciosArchivo = {
  duracion: number;
  silencios: SilencioMarca[];
};

function leerFfmpeg(archivo: string): Promise<string> {
  const bin = rutaFfmpegStatic();
  return new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      ['-i', archivo, '-af', 'silencedetect=noise=-30dB:d=0.6', '-f', 'null', '-'],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let texto = '';
    child.stderr.on('data', (chunk: Buffer) => {
      texto += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(texto);
      else reject(new Error(`silencedetect terminó con código ${code}. ${texto.slice(-300)}`));
    });
  });
}

/** Silencios reales. Umbral cerca de -30 dB y duración mínima de 0,6 s. */
export async function detectarSilencios(archivo: string): Promise<SilenciosArchivo> {
  const texto = await leerFfmpeg(archivo);
  const dur = texto.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!dur) throw new Error('No pude leer la duración para medir silencios.');
  const duracion = Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]);
  const inicios = [...texto.matchAll(/silence_start:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
  const fines = [...texto.matchAll(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/g)];
  const silencios: SilencioMarca[] = [];
  for (let i = 0; i < fines.length; i++) {
    const fin = Number(fines[i]![1]);
    const segundos = Number(fines[i]![2]);
    const inicio = inicios[i] ?? Math.max(0, fin - segundos);
    if (segundos >= 0.6) silencios.push({ inicio, fin, segundos });
  }
  if (inicios.length > fines.length) {
    const inicio = inicios[inicios.length - 1]!;
    const segundos = duracion - inicio;
    if (segundos >= 0.6) silencios.push({ inicio, fin: duracion, segundos });
  }
  return { duracion, silencios };
}
