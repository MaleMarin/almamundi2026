/** Mapea tipo de envío /subir al formato esperado por `lib/huella/translate` (modeOverlay). */
export function huellaFormatFromSubmission(f: string): string {
  switch (f) {
    case "texto":
      return "text";
    case "foto":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    default:
      return "text";
  }
}
