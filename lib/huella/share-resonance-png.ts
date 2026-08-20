/**
 * PNG de resonancia: descargar, compartir (móvil) o copiar al portapapeles (desktop).
 */

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function isMobileUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function canShareFiles(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('png'));
    }, 'image/png');
  });
}

export function downloadPngBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export type ShareResonanceResult = 'shared' | 'copied' | 'downloaded' | 'aborted';

export async function shareOrCopyResonancePng(
  blob: Blob,
  filename: string,
  shareTitle: string
): Promise<ShareResonanceResult> {
  const file = new File([blob], filename, { type: 'image/png' });
  const preferShare =
    typeof navigator.share === 'function' && (isCoarsePointer() || isMobileUa());

  if (preferShare && canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: shareTitle });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'aborted';
    }
  }

  try {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return 'copied';
  } catch {
    /* Safari a veces exige Promise */
  }

  try {
    const item = new ClipboardItem({
      'image/png': Promise.resolve(blob),
    } as Record<string, Blob | Promise<Blob>>);
    await navigator.clipboard.write([item]);
    return 'copied';
  } catch {
    downloadPngBlob(blob, filename);
    return 'downloaded';
  }
}
