import { NextResponse } from "next/server";
import manifest from "@/lib/public-audio-manifest.json";

export const runtime = "nodejs";

/**
 * Lista de rutas públicas de audio generada en build (`scripts/generate-public-audio-manifest.mjs`).
 * No se hace `fs` en runtime: así Vercel no incluye `public/**` dentro de la función (~300 MB límite).
 */
export async function GET() {
  return NextResponse.json({ paths: manifest.paths });
}
