/** Lado mayor máximo antes de subir. */
export const STORY_PHOTO_MAX_EDGE = 2560;
/** JPEG de salida. */
export const STORY_PHOTO_JPEG_QUALITY = 0.85;

function jpegNameFrom(file: File): string {
  const base = file.name.replace(/\.[a-z0-9]+$/i, '').trim() || 'foto';
  return `${base}.jpg`;
}

/**
 * Reduce a 2560 px en el lado mayor y comprime a JPEG 0,85.
 * Si falla el canvas, devuelve el archivo original.
 */
export async function prepareStoryPhotoForUpload(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;
  try {
    const bmp = await createImageBitmap(file);
    const maxSide = Math.max(bmp.width, bmp.height);
    const scale = maxSide > STORY_PHOTO_MAX_EDGE ? STORY_PHOTO_MAX_EDGE / maxSide : 1;
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bmp.close();
      return file;
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', STORY_PHOTO_JPEG_QUALITY)
    );
    if (!blob) return file;
    return new File([blob], jpegNameFrom(file), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
