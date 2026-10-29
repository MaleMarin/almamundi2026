import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { getRespuestaPublicById } from "@/lib/respuestas/by-code";

export const runtime = "nodejs";

/** GET /api/respuestas/public/[id] — una respuesta aprobada, sin correo. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIpFromRequest(request);
  const blocked = await enforceRateLimit(
    getRateLimiter("respuestas-public", 120, 60),
    `respuestas-public:${ip}`,
    { max: 120, windowMs: 60_000 }
  );
  if (blocked) return blocked;

  const { id } = await params;
  const item = await getRespuestaPublicById(id);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(
    { item },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
