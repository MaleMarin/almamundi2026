import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import { editorialPublishApprovedStorySubmission } from "@/lib/editorial/service";

export const runtime = "nodejs";

/** POST /api/curate/publish/[submissionId] — flujo legacy (envío pre-aprobado). Delega en servicio editorial. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { submissionId } = await params;
    const db = getAdminDb();
    const r = await editorialPublishApprovedStorySubmission(db, submissionId, auth.email);
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: r.httpStatus });
    }

    return NextResponse.json({
      ok: true,
      storyId: r.storyId,
      submissionId,
      mailQueued: true,
    });
  } catch (e) {
    console.error("curate publish", e);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
