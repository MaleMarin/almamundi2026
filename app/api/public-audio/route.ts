import { readdir } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Incluye `.mp4` (pista de audio en vídeo) para sonidos subidos por el equipo. */
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4']);

function toUrlPath(absFile: string, publicRoot: string): string {
  let rel = absFile.slice(publicRoot.length).replace(/\\/g, '/');
  if (!rel.startsWith('/')) rel = `/${rel}`;
  return rel;
}

async function walkAudioFiles(dir: string, publicRoot: string, out: Set<string>): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walkAudioFiles(full, publicRoot, out);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (AUDIO_EXT.has(ext)) out.add(toUrlPath(full, publicRoot));
    }
  }
}

/**
 * Lista archivos de audio bajo `public/audio` (recursivo) y en la raíz de `public` (solo archivos sueltos).
 * El cliente reproduce por URL (`fetch` + decode); no se sirve listado de otras carpetas.
 */
export async function GET() {
  const cwd = process.cwd();
  const publicRoot = path.join(cwd, 'public');
  const audioDir = path.join(publicRoot, 'audio');

  const paths = new Set<string>();

  await walkAudioFiles(audioDir, publicRoot, paths);

  try {
    const rootEntries = await readdir(publicRoot, { withFileTypes: true });
    for (const e of rootEntries) {
      if (!e.isFile()) continue;
      const ext = path.extname(e.name).toLowerCase();
      if (AUDIO_EXT.has(ext)) paths.add(`/${e.name}`);
    }
  } catch {
    /* ignore */
  }

  const sorted = [...paths].sort((a, b) => a.localeCompare(b, 'es'));
  return NextResponse.json({ paths: sorted });
}
