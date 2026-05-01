import "server-only";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/adminEmails";

/**
 * Lee el Bearer token de la request y verifica que sea un admin.
 * Uso en API routes: const auth = await requireAdmin(req); if (auth instanceof NextResponse) return auth;
 */
/**
 * Si hay Bearer válido y email en allowlist admin, devuelve `{ email }`; si no hay token o falla, `null`.
 * No responde 401/403 (útil para APIs públicas con vista privilegiada opcional).
 */
export async function getAdminSessionIfPresent(
  req: Request
): Promise<{ email: string } | null> {
  const raw =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!raw) return null;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(raw);
    const email = (decoded.email as string) ?? "";
    if (!isAdminEmail(email)) return null;
    return { email };
  } catch {
    return null;
  }
}

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
