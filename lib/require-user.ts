import "server-only";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

/** Verifica ID token de Firebase (cualquier usuario). */
export async function requireFirebaseUser(
  req: Request
): Promise<{ uid: string; email: string | undefined } | NextResponse> {
  const raw =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(raw);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
