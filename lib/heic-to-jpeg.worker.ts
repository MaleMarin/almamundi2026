/// <reference lib="webworker" />

export type HeicWorkerRequest = {
  id: string;
  buffer: ArrayBuffer;
  name: string;
  type: string;
};

export type HeicWorkerResponse = {
  id: string;
  ok: boolean;
  buffer?: ArrayBuffer;
  name?: string;
  error?: string;
};

function jpegNameFrom(name: string): string {
  const base = name.replace(/\.(heic|heif)$/i, '').trim() || 'foto';
  return base.toLowerCase().endsWith('.jpg') || base.toLowerCase().endsWith('.jpeg')
    ? base
    : `${base}.jpg`;
}

async function viaBitmap(file: File): Promise<Blob | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bmp = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bmp.close();
      return null;
    }
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
  } catch {
    return null;
  }
}

self.onmessage = async (event: MessageEvent<HeicWorkerRequest>) => {
  const { id, buffer, name, type } = event.data;
  try {
    const file = new File([buffer], name, { type: type || 'image/heic' });
    const blob = await viaBitmap(file);
    if (!blob) {
      const res: HeicWorkerResponse = { id, ok: false, error: 'heic_convert_failed' };
      self.postMessage(res);
      return;
    }
    const out = await blob.arrayBuffer();
    const res: HeicWorkerResponse = { id, ok: true, buffer: out, name: jpegNameFrom(name) };
    self.postMessage(res, { transfer: [out] });
  } catch (err) {
    const res: HeicWorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : 'heic_convert_failed',
    };
    self.postMessage(res);
  }
};
