import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** GET /api/health/firebase — comprueba lectura Firestore (falla si Admin o red fallan). */
export async function GET() {
  try {
    const db = getAdminDb();
    await db.collection("stories").limit(1).get();
    return NextResponse.json({ ok: true, firestore: "ok" });
  } catch (e) {
    console.error("[health/firebase]", e);
    return NextResponse.json({ ok: false, firestore: "error" }, { status: 503 });
  }
}
