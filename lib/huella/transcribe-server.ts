import "server-only";
import OpenAI from "openai";
import { getAdminBucket } from "@/lib/firebase/admin";

/** Límite de la API de transcripción de OpenAI. */
const MAX_BYTES = 25 * 1024 * 1024;
const MODELOS = ["gpt-transcribe", "gpt-4o-mini-transcribe"] as const;

/**
 * Transcribe el audio o video privado de un envío. Devuelve null si no hay clave,
 * si el archivo es demasiado grande o si OpenAI no responde. Nunca lanza.
 */
export async function transcribirArchivoPrivado(path: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !path.startsWith("submissions/private/")) return null;
  try {
    const file = getAdminBucket().file(path);
    const [meta] = await file.getMetadata();
    const size = Number(meta.size ?? 0);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) return null;
    const [buffer] = await file.download();
    const type = typeof meta.contentType === "string" && meta.contentType ? meta.contentType : "audio/webm";
    const nombre = path.split("/").pop() || "audio.webm";
    const openai = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
    for (const model of MODELOS) {
      try {
        const res = await openai.audio.transcriptions.create({
          file: new File([new Uint8Array(buffer)], nombre, { type }),
          model,
          response_format: "text",
        });
        const text = typeof res === "string" ? res : ((res as { text?: string }).text ?? "");
        if (text.trim()) return text.trim().slice(0, 20_000);
        return null;
      } catch (err) {
        const status = (err as { status?: number }).status;
        // Si el modelo no existe en la cuenta, prueba el siguiente; otros errores cortan.
        if (status !== 404 && status !== 400) throw err;
      }
    }
    return null;
  } catch (err) {
    console.error("[transcribir]", err instanceof Error ? err.message : "error");
    return null;
  }
}
