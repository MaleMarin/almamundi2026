import { NextRequest, NextResponse } from "next/server";
import { analyzeStory } from "@/lib/huella/analyze";
import { huellaFormatFromSubmission } from "@/lib/impronta/formatMap";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function rateOk(ip: string): boolean {
  const now = Date.now();
  const a = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (a.length >= MAX_PER_WINDOW) return false;
  a.push(now);
  hits.set(ip, a);
  return true;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

/** POST { text?: string, format?: string } → { analysis, visualParams } para resonancia visual (legacy). */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateOk(ip)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const text = typeof o.text === "string" ? o.text : "";
  const format = typeof o.format === "string" ? o.format : "texto";

  try {
    const hf = huellaFormatFromSubmission(format);
    const result = await analyzeStory({ text: text.slice(0, 12000), format: hf });
    return NextResponse.json({
      analysis: result.analysis ?? null,
      visualParams: result.visualParams,
    });
  } catch (e) {
    console.error("[impronta/analyze]", e);
    return NextResponse.json({ error: "No se pudo analizar el texto." }, { status: 500 });
  }
}
