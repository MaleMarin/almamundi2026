import "server-only";
import convert from "heic-convert";

const HEIC_BRAND = /heic|heif|heix|heim|heis|hevc|hevx|mif1|msf1/;

/** Extensión o Content-Type que declara HEIC/HEIF, sin mirar los bytes. */
export function isDeclaredHeic(storagePath: string, contentType = ""): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes("heic") || ct.includes("heif")) return true;
  const path = storagePath.split("?")[0] ?? storagePath;
  return /\.(heic|heif)$/i.test(path);
}

/** Caja `ftyp` de HEIC/HEIF. No trata AVIF como HEIC. */
export function bufferLooksLikeHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const box = buffer.subarray(8, Math.min(buffer.length, 64)).toString("ascii").toLowerCase();
  if (box.includes("avif")) return false;
  return HEIC_BRAND.test(box);
}

export function isRasterImageCandidate(storagePath: string, contentType = ""): boolean {
  const ct = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (ct.startsWith("image/")) return true;
  const path = storagePath.split("?")[0] ?? storagePath;
  return /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(path);
}

/** JPEG a partir de un HEIC/HEIF. No usa binarios nativos. */
export async function heicBufferToJpeg(buffer: Buffer): Promise<Buffer> {
  const out = await convert({
    buffer,
    format: "JPEG",
    quality: 0.9,
  });
  const jpeg = Buffer.from(out);
  if (jpeg.length < 3 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
    throw new Error("heic_convert_failed");
  }
  return jpeg;
}
