import "server-only";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/adminEmails";

export const runtime = "nodejs";

/** POST /api/admin/verify — verifica Firebase idToken y que el email esté en ADMIN_EMAILS. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { idToken?: string };
    const idToken = body.idToken ?? (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!idToken) {
      return NextResponse.json({ ok: false, error: "missing idToken" }, { status: 401 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const email = (decoded.email as string) ?? null;
    if (!isAdminEmail(email)) {
      return NextResponse.json({ ok: false, error: "not admin" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    console.error("[admin/verify]", e);
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
}
