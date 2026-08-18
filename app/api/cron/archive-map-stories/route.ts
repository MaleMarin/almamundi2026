import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { archiveExpiredMapStories } from "@/lib/editorial/service";

export const runtime = "nodejs";

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (secret) return auth === `Bearer ${secret}`;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** GET diario: archiva historias con más de 15 días si hay al menos 40 en el mapa. */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = getAdminDb();
  const archivedIds = await archiveExpiredMapStories(db);
  return NextResponse.json({ ok: true, archived: archivedIds.length, ids: archivedIds });
}
