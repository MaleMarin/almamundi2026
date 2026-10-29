import "server-only";
import sharp from "sharp";
import { canonicalizeStoryMediaMime } from "@/lib/file-sniff";

/** El IFD de GPS (tag 0x8825) sigue en el EXIF. No lee ni devuelve coordenadas. */
function exifHasGps(exif: Buffer): boolean {
  try {
    let offset = 0;
    if (exif.length >= 6 && exif.toString("ascii", 0, 4) === "Exif") offset = 6;
    if (exif.length < offset + 8) return false;
    const order = exif.toString("ascii", offset, offset + 2);
    const le = order === "II";
    if (!le && order !== "MM") return false;
    const u16 = (at: number) => (le ? exif.readUInt16LE(at) : exif.readUInt16BE(at));
    const u32 = (at: number) => (le ? exif.readUInt32LE(at) : exif.readUInt32BE(at));
    const base = offset;
    if (u16(base + 2) !== 42) return false;
    let ifd = base + u32(base + 4);
    const seen = new Set<number>();
    for (let depth = 0; depth < 8 && ifd > 0 && !seen.has(ifd); depth += 1) {
      seen.add(ifd);
      if (ifd + 2 > exif.length) return false;
      const count = u16(ifd);
      for (let i = 0; i < count; i += 1) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > exif.length) return false;
        if (u16(entry) === 0x8825) return true;
      }
      const nextPtr = ifd + 2 + count * 12;
      if (nextPtr + 4 > exif.length) break;
      const next = u32(nextPtr);
      ifd = next ? base + next : 0;
    }
    return false;
  } catch {
    return false;
  }
}

async function bufferHasGps(buffer: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    if (!meta.exif || meta.exif.length < 8) return false;
    return exifHasGps(meta.exif);
  } catch {
    return false;
  }
}

/**
 * Reescribe la imagen sin metadatos (EXIF/XMP/IPTC, incluido GPS).
 * Aplica orientación EXIF antes de borrarla para que la foto no quede rotada.
 * Sharp no conserva metadatos salvo que se llame `withMetadata()`.
 */
export async function stripImageExif(
  buffer: Buffer,
  declaredMime: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const mime = canonicalizeStoryMediaMime(declaredMime);
  if (!mime.startsWith("image/")) {
    return { buffer, contentType: declaredMime };
  }

  const animated = mime === "image/gif" || mime === "image/webp";
  try {
    const pipeline = sharp(buffer, { failOn: "none", animated }).rotate();
    let out: Buffer;
    let contentType: string;
    if (mime === "image/png") {
      out = await pipeline.png().toBuffer();
      contentType = "image/png";
    } else if (mime === "image/webp") {
      out = await pipeline.webp({ quality: 90 }).toBuffer();
      contentType = "image/webp";
    } else if (mime === "image/gif") {
      out = await pipeline.gif().toBuffer();
      contentType = "image/gif";
    } else {
      out = await pipeline.jpeg({ quality: 90 }).toBuffer();
      contentType = "image/jpeg";
    }
    if (await bufferHasGps(out)) {
      throw new Error("gps_not_stripped");
    }
    return { buffer: out, contentType };
  } catch (err) {
    if (err instanceof Error && err.message === "gps_not_stripped") throw err;
    if (mime === "image/heic" || mime === "image/heif") {
      if (await bufferHasGps(buffer)) {
        throw new Error("gps_not_stripped");
      }
      console.warn(
        "[strip-image-exif] HEIC/HEIF no se pudo reescribir en este entorno; se conserva el original",
        err
      );
      return { buffer, contentType: declaredMime };
    }
    throw err;
  }
}
