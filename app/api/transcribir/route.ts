import "server-only";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { transcribirArchivoPrivado } from "@/lib/huella/transcribe-server";
import { cintasSinModelo, textoParaCintas } from "@/lib/cintas-v2/sin-modelo";
import { parseAlmaLocale } from "@/lib/i18n/locale";

export const runtime = "nodejs";
export const maxDuration = 60;

const VENTANA_MS = 2 * 60 * 60 * 1000;

/**
 * POST /api/transcribir { id } — justo después de enviar una historia en audio o video.
 * Transcribe la voz (en privado), calcula la imagen de cintas con lo que se dijo y la guarda en el envío.
 * Devuelve solo las franjas de color, nunca el texto.
 */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const blocked = await enforceRateLimit(getRateLimiter("transcribir", 6, 3600), `transcribir:${ip}`, {
    max: 6,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;
  const body = (await req.json().catch(() => ({}))) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  try {
    const ref = getAdminDb().collection("submissions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
    const data = (snap.data() ?? {}) as Record<string, unknown>;
    if (data.transcripcionEstado === "ok" && Array.isArray(data.huellaUnits) && data.huellaUnits.length) {
      return NextResponse.json({ units: data.huellaUnits });
    }
    const createdAt = typeof data.createdAt === "number" ? data.createdAt : 0;
    if (data.status !== "pending" || !createdAt || Date.now() - createdAt > VENTANA_MS) {
      return NextResponse.json({ units: null });
    }
    if (data.type !== "audio" && data.type !== "video") return NextResponse.json({ units: null });
    const paths = Array.isArray(data.privateMediaPaths) ? data.privateMediaPaths.filter((p): p is string => typeof p === "string") : [];
    const media = paths.find((p) => /\.(webm|mp4|m4a|mp3|wav|ogg|mov|aac|mpeg|mpga)$/i.test(p)) ?? paths[0];
    if (!media) return NextResponse.json({ units: null });

    const transcripcion = await transcribirArchivoPrivado(media);
    if (!transcripcion) {
      await ref.update({ transcripcionEstado: "sin_texto" }).catch(() => undefined);
      return NextResponse.json({ units: null });
    }
    const titulo = typeof data.storyTitle === "string" ? data.storyTitle : "";
    const contexto = typeof data.context === "string" ? data.context : "";
    const locale = parseAlmaLocale(typeof data.locale === "string" ? data.locale : undefined);
    const units = cintasSinModelo({ id, texto: textoParaCintas({ storyTitle: titulo, context: contexto, textBody: transcripcion }), locale });
    await ref.update({ transcripcion, transcripcionEstado: "ok", huellaUnits: units });
    return NextResponse.json({ units });
  } catch (e) {
    console.error("[transcribir POST]", e instanceof Error ? e.message : "error");
    return NextResponse.json({ units: null }, { status: 200 });
  }
}
