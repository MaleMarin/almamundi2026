import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getAdminDb();
    await db.collection("stories").limit(1).get();
    return NextResponse.json({ ok: true, firestore: "ok" });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
