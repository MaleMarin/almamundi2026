import { NextResponse } from "next/server";
import { getAdminDb, getAdminBucket } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * GET /api/health/upload — diagnóstico público mínimo (sin nombres de bucket ni mensajes internos).
 */
export async function GET() {
  let dbOk = false;
  let storageOk = false;
  try {
    const db = getAdminDb();
    await db.collection("stories").limit(1).get();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  try {
    const bucket = getAdminBucket();
    await bucket.getMetadata();
    storageOk = true;
  } catch {
    storageOk = false;
  }

  const ok = dbOk && storageOk;
  return NextResponse.json(
    {
      ok,
      firestore: dbOk ? "ok" : "error",
      storage: storageOk ? "ok" : "error",
    },
    { status: ok ? 200 : 503 }
  );
}
