import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { NEWSLETTER_COLLECTION } from "@/lib/newsletter/subscribers";

export const runtime = "nodejs";

/** GET /api/admin/sonder — suscriptores de la newsletter Sonder (solo admin). ?format=csv descarga la lista. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const snap = await getAdminDb().collection(NEWSLETTER_COLLECTION).get();
    const items = snap.docs
      .map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        return {
          email: String(d.email ?? ""),
          estado: String(d.estado ?? ""),
          idioma: String(d.idioma ?? ""),
          origen: String(d.origen ?? ""),
          desde: String(d.confirmedAt ?? d.consentedAt ?? ""),
        };
      })
      .filter((s) => s.email)
      .sort((a, b) => b.desde.localeCompare(a.desde));
    if (request.nextUrl.searchParams.get("format") === "csv") {
      const soloConfirmados = items.filter((s) => s.estado === "confirmed");
      const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const csv = ["correo,idioma,origen,desde", ...soloConfirmados.map((s) => [s.email, s.idioma, s.origen, s.desde].map(csvCell).join(","))].join("\n");
      return new NextResponse(`﻿${csv}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="sonder-suscriptores.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[admin/sonder]", e instanceof Error ? e.message : "list");
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
