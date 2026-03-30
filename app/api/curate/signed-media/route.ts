import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { signReadUrlForPath } from "@/lib/server-storage";

export const runtime = "nodejs";

/**
 * GET ?path=submissions/private/... — URL firmada corta para previsualizar
 * material privado en paneles de curación (solo admin Firebase + allowlist).
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const path = req.nextUrl.searchParams.get("path")?.trim() ?? "";
  try {
    const url = await signReadUrlForPath(path, 10 * 60 * 1000);
    return NextResponse.redirect(url, 302);
  } catch {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }
}
