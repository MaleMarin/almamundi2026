import "server-only";
import sharp from "sharp";
import { canonicalizeStoryMediaMime } from "@/lib/file-sniff";

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

    if (mime === "image/png") {
      return { buffer: await pipeline.png().toBuffer(), contentType: "image/png" };
    }
    if (mime === "image/webp") {
      return { buffer: await pipeline.webp({ quality: 90 }).toBuffer(), contentType: "image/webp" };
    }
    if (mime === "image/gif") {
      return { buffer: await pipeline.gif().toBuffer(), contentType: "image/gif" };
    }
    if (mime === "image/heic" || mime === "image/heif") {
      return {
        buffer: await pipeline.jpeg({ quality: 90 }).toBuffer(),
        contentType: "image/jpeg",
      };
    }
    return { buffer: await pipeline.jpeg({ quality: 90 }).toBuffer(), contentType: "image/jpeg" };
  } catch (err) {
    if (mime === "image/heic" || mime === "image/heif") {
      console.warn(
        "[strip-image-exif] HEIC/HEIF no se pudo reescribir en este entorno; se conserva el original",
        err
      );
      return { buffer, contentType: declaredMime };
    }
    throw err;
  }
}
