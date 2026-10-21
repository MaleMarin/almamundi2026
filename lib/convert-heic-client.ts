/**
 * Convierte HEIC/HEIF a JPEG en el navegador (sin GPS/EXIF del original).
 * Prioriza un Web Worker para no congelar la página; si falla, usa el hilo principal.
 */

import type { HeicWorkerRequest, HeicWorkerResponse } from './heic-to-jpeg.worker';

export function looksLikeHeic(file: File): boolean {
  const t = (file.type || '').split(';')[0]?.trim().toLowerCase() || '';
  if (t === 'image/heic' || t === 'image/heif' || t === 'image/heic-sequence') return true;
  return /\.(heic|heif)$/i.test(file.name);
}

function jpegNameFrom(file: File): string {
  const base = file.name.replace(/\.(heic|heif)$/i, '').trim() || 'foto';
  return base.toLowerCase().endsWith('.jpg') || base.toLowerCase().endsWith('.jpeg')
    ? base
    : `${base}.jpg`;
}

async function convertViaBitmap(file: File): Promise<File | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bmp.close();
      return null;
    }
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    );
    if (!blob) return null;
    return new File([blob], jpegNameFrom(file), { type: 'image/jpeg' });
  } catch {
    return null;
  }
}

async function convertViaHeicTo(file: File): Promise<File | null> {
  try {
    const { heicTo } = await import('heic-to');
    const blob = (await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.9,
    })) as Blob;
    if (!blob || blob.size < 32) return null;
    return new File([blob], jpegNameFrom(file), { type: 'image/jpeg' });
  } catch (err) {
    console.warn('[heic] conversión heic-to falló; se sube el original', err);
    return null;
  }
}

function convertOnMainThread(file: File): Promise<File> {
  return convertViaBitmap(file).then(async (viaBitmap) => {
    if (viaBitmap) return viaBitmap;
    const viaLib = await convertViaHeicTo(file);
    return viaLib ?? file;
  });
}

function convertInWorker(file: File): Promise<File | null> {
  if (typeof Worker === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./heic-to-jpeg.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      resolve(null);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve(null);
    }, 45_000);

    worker.onmessage = (event: MessageEvent<HeicWorkerResponse>) => {
      if (event.data.id !== id) return;
      window.clearTimeout(timer);
      worker.terminate();
      if (!event.data.ok || !event.data.buffer) {
        resolve(null);
        return;
      }
      resolve(
        new File([event.data.buffer], event.data.name || jpegNameFrom(file), {
          type: 'image/jpeg',
        })
      );
    };
    worker.onerror = () => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(null);
    };

    void file.arrayBuffer().then((buffer) => {
      const req: HeicWorkerRequest = {
        id,
        buffer,
        name: file.name,
        type: file.type,
      };
      worker.postMessage(req, [buffer]);
    });
  });
}

/** HEIC/HEIF → JPEG. Cualquier otro tipo se devuelve igual. Nunca lanza. */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  if (!looksLikeHeic(file)) return file;
  const viaWorker = await convertInWorker(file);
  if (viaWorker) return viaWorker;
  return convertOnMainThread(file);
}

export async function convertHeicFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) {
    out.push(await convertHeicToJpegIfNeeded(f));
  }
  return out;
}
