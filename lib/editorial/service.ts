/**
 * Servicio editorial canónico: publicar desde envíos y operaciones de moderación sobre `stories`.
 * Las rutas API (`/api/admin/publish`, `/api/curate/publish`, etc.) delegan aquí sin duplicar lógica Firestore.
 */
import "server-only";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";
import { FIRESTORE_AUDIENCE_PUBLIC_STATUSES } from "@/lib/editorial/status";
import { canApproveSpanishDraft } from "@/lib/editorial/transitions";
import {
  buildPublishUpdate,
  detectarFormato,
  type PublishPayload,
  type StoryData,
} from "@/lib/story-schema";

const MAX_PUBLISHED_ARCHIVE_CAP = 30;

export type PublishFromSubmissionResult =
  | {
      ok: true;
      storyId: string;
      submissionCollection: "story_submissions" | "submissions";
      authorEmail?: string | null;
      authorDisplayName?: string | null;
      titleForEmail?: string;
      placeLabel?: string | null;
      archivedOldestStoryId?: string;
    }
  | { ok: false; httpStatus: number; error: string };

type StorySubmissionLegacy = Record<string, unknown>;

type SubmissionsPipelineDoc = {
  status?: string;
  type?: string;
  storyTitle?: string;
  alias?: string;
  email?: string;
  themeId?: string;
  date?: string;
  placeLabel?: string;
  context?: string;
  countryLabel?: string;
  payload?: {
    textBody?: string;
    photoUrl?: string;
    photoUrls?: string[];
    audioUrl?: string;
    videoUrl?: string;
  };
  publishedStoryId?: string;
};

function mapSubmissionsTipoToStoryFormat(type: string | undefined): "text" | "audio" | "video" | "image" {
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  if (type === "foto") return "image";
  return "text";
}

function coerceFiniteNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

async function maybeArchiveOldestPublicIfOverCap(db: Firestore): Promise<string | undefined> {
  try {
    const snap = await db
      .collection("stories")
      .where("status", "in", [...FIRESTORE_AUDIENCE_PUBLIC_STATUSES])
      .orderBy("publishedAt", "asc")
      .limit(MAX_PUBLISHED_ARCHIVE_CAP + 1)
      .get();
    if (snap.docs.length <= MAX_PUBLISHED_ARCHIVE_CAP) return undefined;
    const oldest = snap.docs[0];
    await oldest.ref.update({ status: "archived", updatedAt: FieldValue.serverTimestamp() });
    await appendEditorialAuditLog(db, "system", "archive", {
      storyId: oldest.id,
      fromStatus: String(oldest.data()?.status ?? ""),
      toStatus: "archived",
      extras: { reason: "max_public_visible_cap" },
    });
    return oldest.id;
  } catch (e) {
    console.warn("[editorial] maybeArchiveOldestPublicIfOverCap skipped:", e);
    return undefined;
  }
}

async function resolveSubmission(
  db: Firestore,
  submissionId: string
): Promise<
  | { collection: "story_submissions"; ref: DocumentReference; data: StorySubmissionLegacy }
  | {
      collection: "submissions";
      ref: DocumentReference;
      data: SubmissionsPipelineDoc & Record<string, unknown>;
    }
  | null
> {
  const a = await db.collection("story_submissions").doc(submissionId).get();
  if (a.exists) {
    return { collection: "story_submissions", ref: a.ref, data: a.data() as StorySubmissionLegacy };
  }
  const b = await db.collection("submissions").doc(submissionId).get();
  if (b.exists) {
    return { collection: "submissions", ref: b.ref, data: b.data() as SubmissionsPipelineDoc & Record<string, unknown> };
  }
  return null;
}

/**
 * Crear documento público `stories` desde `story_submissions` o `submissions` (pipeline /subir).
 * No envía correo aquí — la capa HTTP decide (Resend, colas legacy, etc.).
 */
export async function editorialPublishFromSubmission(
  db: Firestore,
  submissionId: string,
  actorEmail: string
): Promise<PublishFromSubmissionResult> {
  const resolved = await resolveSubmission(db, submissionId);
  if (!resolved) return { ok: false, httpStatus: 404, error: "submission not found" };

  const existingPublished =
    resolved.data.publishedStoryId != null &&
    typeof resolved.data.publishedStoryId === "string" &&
    resolved.data.publishedStoryId.length > 0;
  if (existingPublished) {
    return { ok: false, httpStatus: 400, error: "already published" };
  }

  if (resolved.collection === "story_submissions") {
    const sub = resolved.data as Record<string, unknown>;
    const rawStatus = String(sub.status ?? "");
    if (
      rawStatus === "rejected" ||
      (rawStatus !== "pending" && rawStatus !== "needs_changes" && rawStatus !== "approved")
    ) {
      return { ok: false, httpStatus: 400, error: "bad submission status" };
    }
    const lat = coerceFiniteNumber(sub.lat);
    const lng = coerceFiniteNumber(sub.lng);
    const now = FieldValue.serverTimestamp();
    const storyRef = db.collection("stories").doc();
    const tags = sub.tags ?? { themes: [], moods: [], keywords: [] };
    const story: Record<string, unknown> = {
      status: "approved",
      editorialSource: "story_submissions",
      sourceSubmissionId: submissionId,
      sourceSubmissionCollection: "story_submissions",
      createdAt: sub.createdAt ?? now,
      updatedAt: now,
      publishedAt: now,
      title: sub.title,
      placeLabel: sub.placeLabel,
      lat,
      lng,
      format: sub.format,
      text: sub.text ?? null,
      media: sub.media ?? {},
      tags,
      excerpt: typeof sub.title === "string" ? sub.title.slice(0, 160) : undefined,
    };
    if (typeof sub.authorName === "string" && sub.authorName.trim()) story.authorName = sub.authorName;
    const cityKnown = typeof sub.city === "string" ? sub.city : undefined;
    const countryKnown = typeof sub.country === "string" ? sub.country : undefined;
    if (cityKnown) story.city = cityKnown;
    if (countryKnown) story.country = countryKnown;

    await storyRef.set(story);
    const archivedOldestStoryId = await maybeArchiveOldestPublicIfOverCap(db);
    await resolved.ref.update({
      status: "approved",
      updatedAt: now,
      publishedStoryId: storyRef.id,
    });
    await appendEditorialAuditLog(db, actorEmail, "approve_from_submission", {
      submissionId,
      submissionCollection: "story_submissions",
      storyId: storyRef.id,
      fromStatus: rawStatus || undefined,
      toStatus: "approved",
    });

    const authorEmail = typeof sub.authorEmail === "string" ? sub.authorEmail.trim() : null;

    const authorDisplayName =
      typeof sub.authorName === "string" && sub.authorName.trim()
        ? sub.authorName.trim()
        : null;

    return {
      ok: true,
      storyId: storyRef.id,
      submissionCollection: "story_submissions",
      authorEmail,
      authorDisplayName,
      titleForEmail: typeof sub.title === "string" ? sub.title : "",
      placeLabel: typeof sub.placeLabel === "string" ? sub.placeLabel : "",
      archivedOldestStoryId,
    };
  }

  const sd = resolved.data as SubmissionsPipelineDoc;
  if (sd.status !== "pending") {
    return { ok: false, httpStatus: 400, error: "bad submission status" };
  }
  const now = FieldValue.serverTimestamp();
  const storyRef = db.collection("stories").doc();
  const formato = mapSubmissionsTipoToStoryFormat(sd.type);
  const themes =
    sd.themeId && sd.themeId.trim().length > 0
      ? ([sd.themeId.trim()] as string[])
      : ([] as string[]);
  const textParts = [sd.context ?? "", sd.payload?.textBody ?? ""].filter((t) => t && t.trim()).join("\n\n");
  const media: Record<string, string> = {};
  if (sd.payload?.videoUrl) media.videoUrl = sd.payload.videoUrl;
  if (sd.payload?.audioUrl) media.audioUrl = sd.payload.audioUrl;
  if (sd.payload?.photoUrls?.length) {
    media.imageUrl = sd.payload.photoUrls[0]!;
  } else if (sd.payload?.photoUrl) {
    media.imageUrl = sd.payload.photoUrl;
  }

  const story: Record<string, unknown> = {
    status: "approved",
    editorialSource: "submissions_pipeline",
    sourceSubmissionId: submissionId,
    sourceSubmissionCollection: "submissions",
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    title: sd.storyTitle,
    excerpt: sd.storyTitle ? String(sd.storyTitle).slice(0, 160) : undefined,
    /** Sin geocoding en servidor: público sí, globo sólo cuando existan coords en revisión posterior. */
    lat: null,
    lng: null,
    format: formato,
    text: textParts.trim().length ? textParts : null,
    media,
    tags: { themes: themes.length ? themes : [], moods: [], keywords: [] },
    authorName: sd.alias,
    placeLabel: sd.placeLabel,
    country: sd.countryLabel ?? undefined,
    city: sd.placeLabel ?? undefined,
  };

  await storyRef.set(story);
  const archivedOldestStoryId = await maybeArchiveOldestPublicIfOverCap(db);
  await resolved.ref.update({
    status: "approved" as SubmissionsPipelineDoc["status"],
    reviewedAt: Date.now(),
    publicId: storyRef.id,
    publishedStoryId: storyRef.id,
  });
  await appendEditorialAuditLog(db, actorEmail, "approve_from_submission", {
    submissionId,
    submissionCollection: "submissions",
    storyId: storyRef.id,
    fromStatus: String(sd.status),
    toStatus: "approved",
  });

  return {
    ok: true,
    storyId: storyRef.id,
    submissionCollection: "submissions",
    authorEmail: typeof sd.email === "string" ? sd.email.trim() : null,
    authorDisplayName: sd.alias ?? null,
    titleForEmail: sd.storyTitle,
    placeLabel: sd.placeLabel ?? null,
    archivedOldestStoryId,
  };
}

/**
 * Igual que `POST /api/curate/publish/[submissionId]` antes: crear `story` desde envío marcado como aprobado.
 * Ejecutado tras que el curator validó datos; marca el envío y escribe historia pública como `approved`.
 */
export async function editorialPublishApprovedStorySubmission(
  db: Firestore,
  submissionId: string,
  actorEmail: string
): Promise<{ ok: true; storyId: string } | { ok: false; httpStatus: number; error: string }> {
  const subRef = db.collection("story_submissions").doc(submissionId);
  const snap = await subRef.get();
  if (!snap.exists) return { ok: false, httpStatus: 404, error: "Submission not found" };
  const data = snap.data() as Record<string, unknown>;
  if (String(data.status) !== "approved") {
    return {
      ok: false,
      httpStatus: 400,
      error: "Submission must be approved before publishing (flujo legacy curate)",
    };
  }
  const publishedStoryIdKnown = typeof data.publishedStoryId === "string" && data.publishedStoryId.length > 0;
  if (publishedStoryIdKnown) {
    return { ok: false, httpStatus: 400, error: "already published" };
  }

  const now = FieldValue.serverTimestamp();
  const storyData: Record<string, unknown> = {
    status: "approved",
    editorialSource: "story_submissions_preapproved",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    sourceSubmissionId: submissionId,
    sourceSubmissionCollection: "story_submissions",
    title: data.title,
    placeLabel: data.placeLabel,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    format: data.format,
    tags: data.tags ?? { themes: [], moods: [], keywords: [] },
    excerpt:
      typeof data.title === "string" ? String(data.title).slice(0, 160) : undefined,
    text: data.text ?? null,
    media: data.media ?? {},
  };
  if (data.authorName) storyData.authorName = data.authorName;

  const storyRef = db.collection("stories").doc();
  await storyRef.set(storyData);
  await subRef.update({
    status: "approved",
    updatedAt: FieldValue.serverTimestamp(),
    publishedStoryId: storyRef.id,
  });
  await maybeArchiveOldestPublicIfOverCap(db);
  await appendEditorialAuditLog(db, actorEmail, "approve_from_submission", {
    submissionId,
    submissionCollection: "story_submissions",
    storyId: storyRef.id,
    fromStatus: String(data.status),
    toStatus: "approved",
  });

  await db.collection("mail_queue").add({
    kind: "story_published",
    createdAt: now,
    to: data.authorEmail,
    payload: {
      storyId: storyRef.id,
      submissionId,
      authorEmail: data.authorEmail,
      title: data.title,
      placeLabel: data.placeLabel,
    },
  });

  return { ok: true, storyId: storyRef.id };
}

/** Publicación in-place desde panel español (`stories` con `titulo` / `pending`). */
export async function editorialPublishSpanishDraftInPlace(args: {
  db: Firestore;
  storyId: string;
  actorEmail: string;
  body: Pick<PublishPayload, "temas" | "curadorNota" | "ubicacion" | "quote">;
}): Promise<{ ok: true } | { ok: false; httpStatus: number; error: string }> {
  const { db, storyId, actorEmail, body } = args;
  const ref = db.collection("stories").doc(storyId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, httpStatus: 404, error: "Historia no encontrada" };

  const storyPartial = snap.data() as Partial<StoryData>;
  const cs = storyPartial.status ?? "";
  if (!canApproveSpanishDraft(String(cs))) {
    return {
      ok: false,
      httpStatus: 409,
      error: `No se puede publicar una historia con status '${cs}'`,
    };
  }

  const formato = storyPartial.formato ?? detectarFormato(storyPartial);
  const payloadFull: PublishPayload = {
    temas: body.temas,
    curadorId: actorEmail,
    curadorNota: body.curadorNota,
    ubicacion: body.ubicacion,
    quote: body.quote,
  };
  const update = {
    ...buildPublishUpdate(payloadFull),
    formato,
  };

  await ref.update(update as Record<string, unknown>);
  await appendEditorialAuditLog(db, actorEmail, "publish_spanish_inplace", {
    storyId,
    fromStatus: String(cs),
    toStatus: "approved",
    extras: { temas: body.temas },
  });

  await db.collection("curation_log").add({
    storyId,
    action: "published_inplace",
    curadorId: actorEmail,
    curadorNota: body.curadorNota ?? null,
    temas: body.temas,
    formato,
    timestamp: new Date().toISOString(),
  });

  return { ok: true };
}

/**
 * Rechazo desde panel (`/api/curate/reject`): prioriza `story_submissions`; si no existe, `stories`.
 */
export async function editorialRejectModerationDocument(args: {
  db: Firestore;
  docId: string;
  actorEmail: string;
  nota?: string | null;
}): Promise<{ ok: true; collection: "story_submissions" | "stories" } | { ok: false; httpStatus: number; error: string }> {
  const { db, docId, actorEmail, nota } = args;
  const subRef = db.collection("story_submissions").doc(docId);
  const storiesRef = db.collection("stories").doc(docId);
  const subSnap = await subRef.get();
  const storySnap = await storiesRef.get();
  const ref = subSnap.exists ? subRef : storySnap.exists ? storiesRef : null;
  if (!ref) return { ok: false, httpStatus: 404, error: "Historia no encontrada" };

  const prev = (subSnap.exists ? subSnap.data() : storySnap.data()) as Record<string, unknown>;
  const rejectedAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();
  await ref.update({
    status: "rejected",
    curadorId: actorEmail,
    curadorNota: nota ?? null,
    rejectedAt,
    updatedAt,
  });
  await appendEditorialAuditLog(db, actorEmail, "reject", {
    storyId: subSnap.exists ? undefined : docId,
    submissionId: subSnap.exists ? docId : undefined,
    submissionCollection: subSnap.exists ? "story_submissions" : undefined,
    fromStatus: String(prev?.status ?? ""),
    toStatus: "rejected",
    note: nota ?? undefined,
  });
  await db.collection("curation_log").add({
    storyId: docId,
    action: "rejected",
    curadorId: actorEmail,
    curadorNota: nota ?? null,
    timestamp: rejectedAt,
  });
  return { ok: true, collection: subSnap.exists ? "story_submissions" : "stories" };
}
