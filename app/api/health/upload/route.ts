import { NextResponse } from "next/server";
import { getAdminDb, getAdminBucket } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** GET /api/health/upload — diagnóstico: ¿Firebase Admin y Storage funcionan? */
export async function GET() {
  const steps: Record<string, string> = {};
  try {
    const db = getAdminDb();
    steps.db = "ok";
  } catch (e) {
    steps.db = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }
  try {
    const bucket = getAdminBucket();
    steps.bucket = `ok (${bucket.name})`;
  } catch (e) {
    steps.bucket = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }
  return NextResponse.json({ ok: true, steps });
}
