import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminBucket } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * GET /api/health/internal — detalle operativo (solo con secreto).
 * Header: x-internal-health: INTERNAL_HEALTH_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = process.env.INTERNAL_HEALTH_SECRET?.trim();
  const sent = req.headers.get("x-internal-health")?.trim() ?? "";
  if (!secret || sent !== secret) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const steps: Record<string, string> = {};
  let firestoreOk = false;
  let storageOk = false;

  try {
    const db = getAdminDb();
    await db.collection("stories").limit(1).get();
    steps.firestore = "ok";
    firestoreOk = true;
  } catch (e) {
    steps.firestore = e instanceof Error ? e.message : "error";
  }

  try {
    const bucket = getAdminBucket();
    const [meta] = await bucket.getMetadata();
    steps.storageBucket = meta.name ?? "configured";
    steps.storage = "ok";
    storageOk = true;
  } catch (e) {
    steps.storage = e instanceof Error ? e.message : "error";
  }

  const ok = firestoreOk && storageOk;
  return NextResponse.json({ ok, steps });
}
