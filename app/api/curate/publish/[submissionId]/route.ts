import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { StorySubmission } from "@/lib/firebase/types";

export const runtime = "nodejs";

/** POST /api/curate/publish/[submissionId] — crea story desde envío aprobado, cola correo, marca envío publicado. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const db = getAdminDb();
    const subRef = db.collection("story_submissions").doc(submissionId);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const data = subSnap.data() as StorySubmission;
    if (data.status !== "approved") {
      return NextResponse.json(
        { error: "Submission must be approved before publishing" },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const storyData: Record<string, unknown> = {
      status: "published",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      sourceSubmissionId: submissionId,
      title: data.title,
      placeLabel: data.placeLabel,
      lat: data.lat,
      lng: data.lng,
      format: data.format,
      tags: data.tags,
      excerpt: data.title.slice(0, 160),
    };
    if (data.text !== undefined) storyData.text = data.text;
    if (data.media !== undefined) storyData.media = data.media;

    const storyRef = await db.collection("stories").add(storyData);
    const storyId = storyRef.id;

    await subRef.update({
      status: "published",
      updatedAt: FieldValue.serverTimestamp(),
      publishedStoryId: storyId,
    });

    const mailItem: Record<string, unknown> = {
      kind: "story_published",
      createdAt: now,
      to: data.authorEmail,
      payload: {
        storyId,
        submissionId,
        authorEmail: data.authorEmail,
        title: data.title,
        placeLabel: data.placeLabel,
      },
    };
    await db.collection("mail_queue").add(mailItem);

    return NextResponse.json({
      ok: true,
      storyId,
      submissionId,
      mailQueued: true,
    });
  } catch (e) {
    console.error("curate publish", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 500 }
    );
  }
}
