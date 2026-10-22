import { createRequire } from 'node:module';

/** Binario de la devDependency ffmpeg-static. No usa Homebrew. */
export function rutaFfmpegStatic(): string {
  const require = createRequire(import.meta.url);
  let ruta: string | null = null;
  try {
    ruta = require('ffmpeg-static') as string | null;
  } catch {
    ruta = null;
  }
  if (!ruta) {
    throw new Error(
      'Falta ffmpeg-static. En la rama exp/cintas-v2, y solo después del OK: npm install --save-dev ffmpeg-static'
    );
  }
  return ruta;
}
