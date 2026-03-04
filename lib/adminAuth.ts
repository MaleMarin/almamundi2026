import "server-only";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/adminEmails";

/**
 * Lee el Bearer token de la request y verifica que sea un admin.
 * Uso en API routes: const auth = await requireAdmin(req); if (auth instanceof NextResponse) return auth;
 */
export async function requireAdmin(
  req: Request
): Promise<{ email: string } | NextResponse> {
  const raw =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(raw);
    const email = (decoded.email as string) ?? "";
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: "not admin" }, { status: 403 });
    }
    return { email };
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
