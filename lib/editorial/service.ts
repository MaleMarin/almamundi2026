/**
 * Servicio editorial canónico: publicar desde envíos y operaciones de moderación sobre `stories`.
 * Las rutas API (`/api/admin/publish`, `/api/curate/publish`, etc.) delegan aquí sin duplicar lógica Firestore.
 */
import "server-only";
import type { CollectionReference, DocumentReference, Firestore } from "firebase-admin/firestore";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { appendDeleteStoryLog, appendEditorialAuditLog } from "@/lib/editorial/audit";
import { normalizeCancionRelacionada } from "@/lib/cancion-relacionada";
import { normalizeAntecedentes, omitAntecedentesFromPublicText } from "@/lib/antecedentes";
import { geocodePublicPlace } from "@/lib/respuestas/geocode";
import { imagenesFromSubmissionPhotos, parseStoryImagenes } from "@/lib/historias/story-imagenes";
import { canApproveSpanishDraft } from "@/lib/editorial/transitions";
import {
  buildPublishUpdate,
  detectarFormato,
  type PublishPayload,
  type StoryData,
} from "@/lib/story-schema";
import { storyAccessibilityFieldsFromRecord } from "@/lib/historias/story-accessibility";
import { resolvePublicRejectionText } from "@/lib/editorial/rejection-reasons";
import { promotePublicStoryMedia } from "@/lib/published-media";
import { getAdminBucket } from "@/lib/firebase/admin";
import {
  assertSafeStoryId,
  assertSafeSubmissionsPath,
  deleteStoryStorageFiles,
  storageObjectPathFromUrl,
} from "@/lib/server-storage";
import { publishBlockedByMalware } from "@/lib/malware-scan";
import { isQuestionMode, resolveQuestionId } from "@/lib/pregunta-semana";
import { deleteAuthorContact, saveAuthorPrivate } from "@/lib/author-contacts";
import {
  notifyAuthorStoryRejected,
  type RejectionMailCollection,
  type RejectionMailRecord,
} from "@/lib/email/notify-author-rejected";

/** El tope del globo ya no archiva. Las aprobadas siguen en /historias. */
async function maybeArchiveOldestPublicIfOverCap(_db: Firestore): Promise<string | undefined> {
  return undefined;
}

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
  cancionRelacionada?: string;
  antecedentes?: string;
  payload?: {
    textBody?: string;
    photoUrl?: string;
    photoUrls?: string[];
    photoAlts?: string[];
    photoFichas?: {
      nombre?: string;
      anio?: string;
      decada?: string;
      lugar?: string;
      alt?: string;
    }[];
    audioUrl?: string;
    videoUrl?: string;
  };
  publishedStoryId?: string;
  privateMediaPaths?: string[];
  profilePhotoUrl?: string;
  lat?: number | null;
  lng?: number | null;
};

function mapSubmissionsTipoToStoryFormat(type: string | undefined): "text" | "audio" | "video" | "image" {
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  if (type === "foto") return "image";
  return "text";
}

function copyOptionalPublicFields(story: Record<string, unknown>, source: Record<string, unknown>) {
  const cancion = normalizeCancionRelacionada(source.cancionRelacionada);
  if (cancion) story.cancionRelacionada = cancion;
  const imagenes = parseStoryImagenes(source.imagenes);
  if (imagenes) story.imagenes = imagenes;
  const questionId = resolveQuestionId(source.questionId);
  if (questionId) story.questionId = questionId;
  if (isQuestionMode(source.questionMode)) story.questionMode = source.questionMode;
}

function coerceFiniteNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function scrubPublicNote(story: Record<string, unknown>, note?: string) {
  if (typeof story.text === "string") {
    const cleaned = omitAntecedentesFromPublicText(story.text, note);
    story.text = cleaned || null;
  }
  delete story.antecedentes;
  delete story.ageRange;
  delete story.sex;
  delete story.age;
  delete story.gender;
}

function privateFieldsFromSource(source: Record<string, unknown>, email: string) {
  return {
    email,
    ageRange: typeof source.ageRange === "string" ? source.ageRange : null,
    sex: typeof source.sex === "string" ? source.sex : null,
    antecedentes: normalizeAntecedentes(source.antecedentes) ?? null,
  };
}

async function coordsForPlace(
  city: unknown,
  country: unknown,
  lat: unknown,
  lng: unknown
): Promise<{ lat: number; lng: number } | null> {
  const knownLat = coerceFiniteNumber(lat);
  const knownLng = coerceFiniteNumber(lng);
  if (knownLat != null && knownLng != null) return { lat: knownLat, lng: knownLng };
  return geocodePublicPlace(typeof city === "string" ? city : "", typeof country === "string" ? country : "");
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
function applyPublicTemas(
  story: Record<string, unknown>,
  temas?: { temas: string[]; ejes: string[] }
) {
  if (!temas) return;
  story.temas = temas.temas;
  story.ejes = temas.ejes;
}

export async function editorialPublishFromSubmission(
  db: Firestore,
  submissionId: string,
  actorEmail: string,
  temas?: { temas: string[]; ejes: string[] }
): Promise<PublishFromSubmissionResult> {
  const resolved = await resolveSubmission(db, submissionId);
  if (!resolved) return { ok: false, httpStatus: 404, error: "submission not found" };

  const malwareBlock = publishBlockedByMalware(resolved.data);
  if (malwareBlock.blocked) {
    return { ok: false, httpStatus: 409, error: malwareBlock.error };
  }

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
    const coords = await coordsForPlace(
      typeof sub.city === "string" && sub.city.trim() ? sub.city : sub.placeLabel,
      sub.country,
      sub.lat,
      sub.lng
    );
    if (!coords) return { ok: false, httpStatus: 422, error: "location_not_found" };
    const lat = coords.lat;
    const lng = coords.lng;
    const now = FieldValue.serverTimestamp();
    const storyRef = db.collection("stories").doc();
    const rawMedia: Record<string, string> = {};
    if (sub.media && typeof sub.media === "object" && !Array.isArray(sub.media)) {
      for (const [k, v] of Object.entries(sub.media as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) rawMedia[k] = v.trim();
      }
    }
    const promoted = await promotePublicStoryMedia({
      storyId: storyRef.id,
      privateMediaPaths: sub.privateMediaPaths,
      bag: {
        media: rawMedia,
        imagenes: parseStoryImagenes(sub.imagenes),
        profilePhotoUrl:
          typeof sub.profilePhotoUrl === "string" ? sub.profilePhotoUrl : undefined,
      },
    });
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
      media: promoted.media ?? {},
      tags,
      excerpt: typeof sub.title === "string" ? sub.title.slice(0, 160) : undefined,
    };
    applyPublicTemas(story, temas);
    if (typeof sub.authorName === "string" && sub.authorName.trim()) story.authorName = sub.authorName;
    const authorEmailOnSub =
      typeof sub.authorEmail === "string"
        ? sub.authorEmail.trim()
        : typeof sub.email === "string"
          ? sub.email.trim()
          : "";
    const cityKnown = typeof sub.city === "string" ? sub.city : undefined;
    const countryKnown = typeof sub.country === "string" ? sub.country : undefined;
    if (cityKnown) story.city = cityKnown;
    if (countryKnown) story.country = countryKnown;
    const privateNote = normalizeAntecedentes(sub.antecedentes);
    copyOptionalPublicFields(story, sub);
    scrubPublicNote(story, privateNote);
    if (promoted.imagenes?.length) story.imagenes = promoted.imagenes;
    if (promoted.profilePhotoUrl) story.profilePhotoUrl = promoted.profilePhotoUrl;
    if (promoted.publishedMediaPaths.length) {
      story.publishedMediaPaths = promoted.publishedMediaPaths;
    }
    Object.assign(story, storyAccessibilityFieldsFromRecord(sub));

    await storyRef.set(story);
    await saveAuthorPrivate(db, storyRef.id, privateFieldsFromSource(sub, authorEmailOnSub));
    const archivedOldestStoryId = await maybeArchiveOldestPublicIfOverCap(db);
    await resolved.ref.update({
      status: "approved",
      updatedAt: now,
      publishedStoryId: storyRef.id,
      lat,
      lng,
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
  const textParts = omitAntecedentesFromPublicText(
    [sd.context ?? "", sd.payload?.textBody ?? ""].filter((t) => t && t.trim()).join("\n\n"),
    normalizeAntecedentes(sd.antecedentes)
  );
  const coords = await coordsForPlace(sd.placeLabel, sd.countryLabel, sd.lat, sd.lng);
  if (!coords) return { ok: false, httpStatus: 422, error: "location_not_found" };
  const rawMedia: Record<string, string> = {};
  if (sd.payload?.videoUrl) rawMedia.videoUrl = sd.payload.videoUrl;
  if (sd.payload?.audioUrl) rawMedia.audioUrl = sd.payload.audioUrl;
  const photoUrls = sd.payload?.photoUrls?.length
    ? sd.payload.photoUrls
    : sd.payload?.photoUrl
      ? [sd.payload.photoUrl]
      : [];
  if (photoUrls[0]) rawMedia.imageUrl = photoUrls[0];
  const promoted = await promotePublicStoryMedia({
    storyId: storyRef.id,
    privateMediaPaths: sd.privateMediaPaths,
    bag: {
      media: rawMedia,
      imagenes: photoUrls.length
        ? imagenesFromSubmissionPhotos(photoUrls, sd.payload?.photoFichas, sd.payload?.photoAlts)
        : undefined,
      profilePhotoUrl: sd.profilePhotoUrl,
    },
  });
  const media = promoted.media ?? {};
  const imagenes = promoted.imagenes;

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
    lat: coords.lat,
    lng: coords.lng,
    format: formato,
    text: textParts.trim().length ? textParts : null,
    media,
    tags: { themes: themes.length ? themes : [], moods: [], keywords: [] },
    authorName: sd.alias,
    placeLabel: sd.placeLabel,
    country: sd.countryLabel ?? undefined,
    city: sd.placeLabel ?? undefined,
    ...(imagenes?.length ? { imagenes } : {}),
  };
  applyPublicTemas(story, temas);
  const pipelineNote = normalizeAntecedentes(sd.antecedentes);
  copyOptionalPublicFields(story, sd as unknown as Record<string, unknown>);
  scrubPublicNote(story, pipelineNote);
  if (imagenes?.length) story.imagenes = imagenes;
  if (promoted.profilePhotoUrl) story.profilePhotoUrl = promoted.profilePhotoUrl;
  if (promoted.publishedMediaPaths.length) {
    story.publishedMediaPaths = promoted.publishedMediaPaths;
  }
  Object.assign(story, storyAccessibilityFieldsFromRecord(sd as unknown as Record<string, unknown>));

  await storyRef.set(story);
  const pipelineEmail = typeof sd.email === "string" ? sd.email.trim() : "";
  await saveAuthorPrivate(
    db,
    storyRef.id,
    privateFieldsFromSource(sd as unknown as Record<string, unknown>, pipelineEmail)
  );
  const archivedOldestStoryId = await maybeArchiveOldestPublicIfOverCap(db);
  await resolved.ref.update({
    status: "approved" as SubmissionsPipelineDoc["status"],
    reviewedAt: Date.now(),
    publicId: storyRef.id,
    publishedStoryId: storyRef.id,
    lat: coords.lat,
    lng: coords.lng,
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
  const malwareBlock = publishBlockedByMalware(data);
  if (malwareBlock.blocked) {
    return { ok: false, httpStatus: 409, error: malwareBlock.error };
  }
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

  const legacyCoords = await coordsForPlace(data.placeLabel, data.country, data.lat, data.lng);
  if (!legacyCoords) return { ok: false, httpStatus: 422, error: "location_not_found" };
  const now = FieldValue.serverTimestamp();
  const storyRef = db.collection("stories").doc();
  const rawMedia: Record<string, string> = {};
  if (data.media && typeof data.media === "object" && !Array.isArray(data.media)) {
    for (const [k, v] of Object.entries(data.media as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) rawMedia[k] = v.trim();
    }
  }
  const promoted = await promotePublicStoryMedia({
    storyId: storyRef.id,
    privateMediaPaths: data.privateMediaPaths,
    bag: {
      media: rawMedia,
      imagenes: parseStoryImagenes(data.imagenes),
      profilePhotoUrl:
        typeof data.profilePhotoUrl === "string" ? data.profilePhotoUrl : undefined,
    },
  });
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
    lat: legacyCoords.lat,
    lng: legacyCoords.lng,
    format: data.format,
    tags: data.tags ?? { themes: [], moods: [], keywords: [] },
    excerpt:
      typeof data.title === "string" ? String(data.title).slice(0, 160) : undefined,
    text: data.text ?? null,
    media: promoted.media ?? {},
  };
  if (data.authorName) storyData.authorName = data.authorName;
  const authorEmailLegacy =
    typeof data.authorEmail === "string"
      ? data.authorEmail.trim()
      : typeof data.email === "string"
        ? data.email.trim()
        : "";
  const legacyNote = normalizeAntecedentes(data.antecedentes);
  copyOptionalPublicFields(storyData, data);
  scrubPublicNote(storyData, legacyNote);
  if (promoted.imagenes?.length) storyData.imagenes = promoted.imagenes;
  if (promoted.profilePhotoUrl) storyData.profilePhotoUrl = promoted.profilePhotoUrl;
  if (promoted.publishedMediaPaths.length) {
    storyData.publishedMediaPaths = promoted.publishedMediaPaths;
  }
  Object.assign(storyData, storyAccessibilityFieldsFromRecord(data));

  await storyRef.set(storyData);
  await saveAuthorPrivate(db, storyRef.id, privateFieldsFromSource(data, authorEmailLegacy));
  await subRef.update({
    status: "approved",
    updatedAt: FieldValue.serverTimestamp(),
    publishedStoryId: storyRef.id,
    lat: legacyCoords.lat,
    lng: legacyCoords.lng,
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
  const raw = snap.data() as Record<string, unknown>;
  const rawMedia: Record<string, string> = {};
  if (raw.media && typeof raw.media === "object" && !Array.isArray(raw.media)) {
    for (const [k, v] of Object.entries(raw.media as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) rawMedia[k] = v.trim();
    }
  }
  const promoted = await promotePublicStoryMedia({
    storyId,
    privateMediaPaths: raw.privateMediaPaths,
    bag: {
      media: rawMedia,
      imagenes: parseStoryImagenes(raw.imagenes),
      videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl : storyPartial.videoUrl,
      audioUrl: typeof raw.audioUrl === "string" ? raw.audioUrl : storyPartial.audioUrl,
      imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : storyPartial.imageUrl,
      images: Array.isArray(raw.images)
        ? raw.images.filter((u): u is string => typeof u === "string")
        : storyPartial.images,
    },
  });
  const update: Record<string, unknown> = {
    ...buildPublishUpdate(payloadFull),
    formato,
  };
  if (promoted.media) update.media = promoted.media;
  if (promoted.imagenes?.length) update.imagenes = promoted.imagenes;
  if (promoted.videoUrl) update.videoUrl = promoted.videoUrl;
  if (promoted.audioUrl) update.audioUrl = promoted.audioUrl;
  if (promoted.imageUrl) update.imageUrl = promoted.imageUrl;
  if (promoted.images?.length) update.images = promoted.images;
  if (promoted.publishedMediaPaths.length) {
    update.publishedMediaPaths = promoted.publishedMediaPaths;
  }
  const draftEmail = typeof raw.authorEmail === "string" ? raw.authorEmail.trim() : "";
  const draftNote = normalizeAntecedentes(raw.antecedentes);
  await saveAuthorPrivate(db, storyId, privateFieldsFromSource(raw, draftEmail));
  if (draftEmail) update.authorEmail = FieldValue.delete();
  if (typeof raw.ageRange === "string" && raw.ageRange.trim()) update.ageRange = FieldValue.delete();
  if (typeof raw.sex === "string" && raw.sex.trim()) update.sex = FieldValue.delete();
  if (raw.age != null && raw.age !== "") update.age = FieldValue.delete();
  if (raw.gender != null && raw.gender !== "") update.gender = FieldValue.delete();
  if (draftNote) {
    update.antecedentes = FieldValue.delete();
    if (typeof raw.text === "string") {
      update.text = omitAntecedentesFromPublicText(raw.text, draftNote) || null;
    }
  }

  await ref.update(update);
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

const REJECT_LOOKUP_ORDER = ["submissions", "story_submissions", "stories"] as const;

async function mirrorRejectionOntoSubmissions(args: {
  db: Firestore;
  docId: string;
  primaryCollection: RejectionMailCollection;
  prev: Record<string, unknown>;
  payload: Record<string, unknown>;
}): Promise<void> {
  const { db, docId, primaryCollection, prev, payload } = args;
  const ids = new Set<string>([docId]);
  if (typeof prev.sourceSubmissionId === "string" && prev.sourceSubmissionId.trim()) {
    ids.add(prev.sourceSubmissionId.trim());
  }
  for (const id of ids) {
    if (primaryCollection === "submissions" && id === docId) continue;
    const ref = db.collection("submissions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) continue;
    await ref.update(payload);
  }
}

/**
 * Rechazo desde panel (`/api/curate/reject`): `submissions` (pipeline vivo), luego `story_submissions`, luego `stories`.
 * Exige motivo público; el correo al autor no bloquea el rechazo si Resend falla.
 */
export async function editorialRejectModerationDocument(args: {
  db: Firestore;
  docId: string;
  actorEmail: string;
  nota?: string | null;
  reasonId?: unknown;
  reasonDetail?: unknown;
}): Promise<
  | { ok: true; collection: RejectionMailCollection; rejectionMail: RejectionMailRecord }
  | { ok: false; httpStatus: number; error: string }
> {
  const { db, docId, actorEmail, nota } = args;
  const reason = resolvePublicRejectionText(args.reasonId, args.reasonDetail);
  if (!reason.ok) return { ok: false, httpStatus: 400, error: reason.error };

  let ref: DocumentReference | null = null;
  let prev: Record<string, unknown> = {};
  let collection: RejectionMailCollection | null = null;
  for (const col of REJECT_LOOKUP_ORDER) {
    const candidate = db.collection(col).doc(docId);
    const snap = await candidate.get();
    if (!snap.exists) continue;
    ref = candidate;
    prev = (snap.data() ?? {}) as Record<string, unknown>;
    collection = col;
    break;
  }
  if (!ref || !collection) return { ok: false, httpStatus: 404, error: "Historia no encontrada" };

  const rejectedAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: "rejected",
    curadorId: actorEmail,
    curadorNota: nota ?? null,
    rejectionReasonId: reason.reasonId,
    rejectionReason: reason.publicText,
    rejectionReasonDetail: reason.detail || null,
    rejectedAt,
    updatedAt,
  };
  await ref.update(payload);
  await mirrorRejectionOntoSubmissions({
    db,
    docId,
    primaryCollection: collection,
    prev,
    payload,
  });
  await appendEditorialAuditLog(db, actorEmail, "reject", {
    storyId: collection === "stories" ? docId : undefined,
    submissionId: collection === "stories" ? undefined : docId,
    submissionCollection: collection === "stories" ? undefined : collection,
    fromStatus: String(prev?.status ?? ""),
    toStatus: "rejected",
    note: nota ?? undefined,
    extras: { reasonId: reason.reasonId, rejectionReason: reason.publicText },
  });
  await db.collection("curation_log").add({
    storyId: docId,
    action: "rejected",
    curadorId: actorEmail,
    curadorNota: nota ?? null,
    rejectionReasonId: reason.reasonId,
    rejectionReason: reason.publicText,
    timestamp: rejectedAt,
  });

  const rejectionMail = await notifyAuthorStoryRejected({
    db,
    collection,
    docId,
    publicReason: reason.publicText,
  });
  if (collection !== "submissions") {
    await mirrorRejectionOntoSubmissions({
      db,
      docId,
      primaryCollection: collection,
      prev,
      payload: { rejectionMail },
    });
  }

  return { ok: true, collection, rejectionMail };
}

const STORY_URL_FIELDS = [
  "videoUrl",
  "audioUrl",
  "imageUrl",
  "profilePhotoUrl",
  "mediaUrl",
  "coverImageUrl",
  "storagePath",
] as const;

function pushStorageRef(out: string[], value: unknown) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (!trimmed) return;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const path = storageObjectPathFromUrl(trimmed);
    if (path) out.push(path);
    return;
  }
  out.push(trimmed);
}

function collectStoryStorageRefs(data: Record<string, unknown>, out: string[]) {
  for (const key of STORY_URL_FIELDS) pushStorageRef(out, data[key]);
  for (const key of ["publishedMediaPaths", "privateMediaPaths", "images"] as const) {
    const arr = data[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) pushStorageRef(out, item);
  }
  const media = data.media;
  if (media && typeof media === "object" && !Array.isArray(media)) {
    for (const value of Object.values(media as Record<string, unknown>)) pushStorageRef(out, value);
  }
  const imagenes = parseStoryImagenes(data.imagenes);
  if (imagenes) {
    for (const img of imagenes) pushStorageRef(out, img.url);
  }
}

async function collectTreeStorageRefs(ref: DocumentReference, out: string[]): Promise<void> {
  const cols = await ref.listCollections();
  for (const col of cols) {
    let snap = await col.orderBy(FieldPath.documentId()).limit(100).get();
    while (!snap.empty) {
      for (const doc of snap.docs) {
        collectStoryStorageRefs((doc.data() ?? {}) as Record<string, unknown>, out);
        await collectTreeStorageRefs(doc.ref, out);
      }
      if (snap.size < 100) break;
      const last = snap.docs[snap.docs.length - 1];
      snap = await col.orderBy(FieldPath.documentId()).startAfter(last).limit(100).get();
    }
  }
}

async function collectSourceSubmissionStorageRefs(
  db: Firestore,
  data: Record<string, unknown>,
  out: string[]
): Promise<void> {
  const id = typeof data.sourceSubmissionId === "string" ? data.sourceSubmissionId.trim() : "";
  const col = data.sourceSubmissionCollection;
  if (!id || (col !== "story_submissions" && col !== "submissions")) return;
  if (id.includes("/") || id.includes("..")) return;
  const snap = await db.collection(col).doc(id).get();
  if (!snap.exists) return;
  collectStoryStorageRefs((snap.data() ?? {}) as Record<string, unknown>, out);
}

async function deleteCollectionDocs(col: CollectionReference): Promise<void> {
  const snap = await col.limit(100).get();
  if (snap.empty) return;
  for (const doc of snap.docs) {
    await deleteDocumentTree(doc.ref);
  }
  if (snap.size === 100) await deleteCollectionDocs(col);
}

async function deleteDocumentTree(ref: DocumentReference): Promise<void> {
  const cols = await ref.listCollections();
  for (const col of cols) {
    await deleteCollectionDocs(col);
  }
  await ref.delete();
}

async function detachStoryFromCollections(db: Firestore, storyId: string): Promise<void> {
  const snap = await db.collection("collections").where("storyIds", "array-contains", storyId).get();
  for (const doc of snap.docs) {
    await doc.ref.update({
      storyIds: FieldValue.arrayRemove(storyId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function deleteOriginSubmission(
  db: Firestore,
  storyId: string,
  data: Record<string, unknown>
): Promise<void> {
  const id = typeof data.sourceSubmissionId === "string" ? data.sourceSubmissionId.trim() : "";
  if (!id || id.includes("/") || id.includes("..")) return;
  const named = data.sourceSubmissionCollection;
  const names: Array<"story_submissions" | "submissions"> =
    named === "story_submissions" || named === "submissions"
      ? [named]
      : ["story_submissions", "submissions"];
  for (const name of names) {
    const ref = db.collection(name).doc(id);
    const snap = await ref.get();
    if (!snap.exists) continue;
    if (names.length > 1) {
      const published = snap.get("publishedStoryId");
      if (typeof published === "string" && published && published !== storyId) continue;
    }
    await deleteDocumentTree(ref);
    return;
  }
}

/**
 * Borra una historia de `stories`, sus subcolecciones, el envío de origen
 * (`submissions` o `story_submissions`) y los archivos de Storage citados.
 */
export async function editorialDeleteStory(args: {
  db: Firestore;
  storyId: string;
  deletedBy: string;
}): Promise<{ ok: true } | { ok: false; httpStatus: number; error: string }> {
  const { db, deletedBy } = args;
  let storyId = "";
  try {
    storyId = assertSafeStoryId(args.storyId);
  } catch {
    return { ok: false, httpStatus: 400, error: "Historia no válida" };
  }

  const ref = db.collection("stories").doc(storyId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, httpStatus: 404, error: "Historia no encontrada" };

  const data = (snap.data() ?? {}) as Record<string, unknown>;
  const paths: string[] = [];
  collectStoryStorageRefs(data, paths);
  await collectTreeStorageRefs(ref, paths);
  await collectSourceSubmissionStorageRefs(db, data, paths);
  await deleteStoryStorageFiles(storyId, paths);
  await deleteOriginSubmission(db, storyId, data);
  await deleteDocumentTree(ref);
  await deleteAuthorContact(db, storyId);
  try {
    await detachStoryFromCollections(db, storyId);
  } catch (e) {
    console.error("[editorial] detach story from collections", e);
  }
  await appendDeleteStoryLog(db, storyId, deletedBy);
  return { ok: true };
}

/**
 * Borra un envío pendiente de `submissions` o `story_submissions` y sus archivos privados.
 * No toca `stories` ni otros documentos.
 */
export async function editorialDeleteSubmission(args: {
  db: Firestore;
  submissionId: string;
  deletedBy: string;
}): Promise<{ ok: true } | { ok: false; httpStatus: number; error: string }> {
  const id = args.submissionId.trim();
  if (!/^[A-Za-z0-9]{8,128}$/.test(id)) {
    return { ok: false, httpStatus: 400, error: "Envío no válido" };
  }
  let ref: DocumentReference | null = null;
  let collection: "submissions" | "story_submissions" | null = null;
  for (const name of ["submissions", "story_submissions"] as const) {
    const candidate = args.db.collection(name).doc(id);
    const found = await candidate.get();
    if (!found.exists) continue;
    ref = candidate;
    collection = name;
    break;
  }
  if (!ref || !collection) return { ok: false, httpStatus: 404, error: "Envío no encontrado" };
  const snap = await ref.get();
  const data = (snap.data() ?? {}) as Record<string, unknown>;
  if (String(data.status ?? "") !== "pending") {
    return { ok: false, httpStatus: 409, error: "Este envío ya no está pendiente" };
  }
  const paths: string[] = [];
  collectStoryStorageRefs(data, paths);
  const bucket = getAdminBucket();
  const seen = new Set<string>();
  for (const raw of paths) {
    const storagePath = raw.trim();
    if (!storagePath || seen.has(storagePath)) continue;
    seen.add(storagePath);
    try {
      assertSafeSubmissionsPath(storagePath);
    } catch {
      continue;
    }
    if (!storagePath.startsWith("submissions/private/")) continue;
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
  }
  await ref.delete();
  await appendEditorialAuditLog(args.db, args.deletedBy, "delete_story", {
    submissionId: id,
    submissionCollection: collection,
    fromStatus: "pending",
  });
  return { ok: true };
}
