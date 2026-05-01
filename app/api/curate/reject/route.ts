/**
 * POST /api/curate/reject — compatibilidad con panel; delega rechazo editorial central.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import { editorialRejectModerationDocument } from "@/lib/editorial/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const actorEmail = auth.email;

  try {
    const body = (await req.json()) as {
      storyId: string;
      nota?: string;
    };

    const { storyId, nota } = body;

    if (!storyId) {
      return NextResponse.json({ error: "storyId es requerido" }, { status: 400 });
    }

    const db = getAdminDb();
    const r = await editorialRejectModerationDocument({
      db,
      docId: storyId,
      actorEmail,
      nota,
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: r.httpStatus });
    }

    return NextResponse.json({
      ok: true,
      storyId,
      collection: r.collection,
      rejectedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[curate/reject]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
