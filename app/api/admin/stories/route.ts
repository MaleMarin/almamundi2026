import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { FIRESTORE_AUDIENCE_PUBLIC_STATUSES } from "@/lib/editorial/status";
import { parseStoryImagenes } from "@/lib/historias/story-imagenes";
import { AUTHOR_CONTACTS_COLLECTION, authorEmailOnStory } from "@/lib/author-contacts";
import { extractPrivateStoragePathFromUrl } from "@/lib/published-media";
import { isDeclaredHeic } from "@/lib/heic-jpeg";
import { consentRowsFromRecord } from "@/lib/legal-consent";
import { AGE_RANGE_OPTIONS } from "@/lib/subir-author-fields";
import { privateObjectContentType, signReadUrlForPath } from "@/lib/server-storage";

export const runtime = "nodejs";

type StoryStatus = "pending" | "active" | "archived" | "rejected";

function toMillis(ts: unknown): number | null {
  if (ts == null) return null;
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

type PendingFile = {
  url: string;
  kind: "image" | "audio" | "video" | "file" | "heic";
  storagePath?: string;
};

function submissionFormat(type: unknown): "video" | "audio" | "text" | "photos" {
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  if (type === "foto" || type === "photo" || type === "fotos" || type === "image" || type === "photos") {
    return "photos";
  }
  return "text";
}

function fileKind(path: string, type: string): PendingFile["kind"] {
  const lower = path.toLowerCase();
  if (/\.(heic|heif)$/.test(lower)) return "heic";
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return "image";
  if (/\.(mp3|m4a|wav|ogg|aac)$/.test(lower)) return "audio";
  if (/\.(mp4|mov|webm)$/.test(lower)) {
    if (type === "audio") return "audio";
    if (type === "video") return "video";
    return lower.endsWith(".webm") ? "audio" : "video";
  }
  return "file";
}

type PendingSource = "submissions" | "story_submissions";

const AGE_LABEL = new Map(AGE_RANGE_OPTIONS.map((option) => [option.id, option.label]));
const SEX_LABEL: Record<string, string> = {
  femenino: "Femenino",
  masculino: "Masculino",
  "no-binario": "No binario",
  "prefiero-no-decir": "Prefiero no decirlo",
  otro: "Otro",
};

function textField(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function payloadOf(data: Record<string, unknown>): Record<string, unknown> {
  const payload = data.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload as Record<string, unknown>;
}

function relatoOf(data: Record<string, unknown>, source: PendingSource): string {
  if (source === "story_submissions") return textField(data, "text", "body");
  const body = textField(payloadOf(data), "textBody");
  if (body) return body;
  return textField(data, "context");
}

type AdminImagen = {
  url: string;
  titulo?: string;
  anio?: string;
  anioAprox?: boolean;
  lugar?: string;
  descripcion?: string;
};

function imagenFromParsed(img: {
  url: string;
  titulo?: string;
  anio?: string;
  anioAprox?: boolean;
  lugar?: string;
  descripcion?: string;
}): AdminImagen {
  return {
    url: img.url,
    ...(img.titulo ? { titulo: img.titulo } : {}),
    ...(img.anio ? { anio: img.anio } : {}),
    ...(img.anioAprox ? { anioAprox: true } : {}),
    ...(img.lugar ? { lugar: img.lugar } : {}),
    ...(img.descripcion ? { descripcion: img.descripcion } : {}),
  };
}

/** Nombre, año, lugar y descripción escritos en cada foto del envío. */
function photoNotesFromSubmission(data: Record<string, unknown>): AdminImagen[] {
  const payload = payloadOf(data);
  const fichas = Array.isArray(payload.photoFichas) ? payload.photoFichas : [];
  const alts = Array.isArray(payload.photoAlts) ? payload.photoAlts : [];
  const count = Math.max(fichas.length, alts.length);
  const notes: AdminImagen[] = [];
  for (let i = 0; i < count; i++) {
    const raw = fichas[i];
    const ficha = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const titulo = textField(ficha, "nombre", "titulo");
    const anioExacto = textField(ficha, "anio");
    const decada = textField(ficha, "decada");
    const anio = anioExacto || decada;
    const lugar = textField(ficha, "lugar");
    const descripcion = textField(ficha, "alt", "descripcion") || textField({ alt: alts[i] }, "alt");
    if (!titulo && !anio && !lugar && !descripcion) continue;
    notes.push({
      url: "",
      ...(titulo ? { titulo } : {}),
      ...(anio ? { anio } : {}),
      ...(anioExacto ? {} : decada ? { anioAprox: true } : {}),
      ...(lugar ? { lugar } : {}),
      ...(descripcion ? { descripcion } : {}),
    });
  }
  return notes;
}

function imagenesOf(data: Record<string, unknown>, source: PendingSource): AdminImagen[] {
  const parsed = (parseStoryImagenes(data.imagenes) ?? []).map(imagenFromParsed);
  if (source === "story_submissions") return parsed;
  const notes = photoNotesFromSubmission(data);
  return notes.length ? notes : parsed;
}

async function filesForSubmission(data: Record<string, unknown>, type: string): Promise<PendingFile[]> {
  const paths = Array.isArray(data.privateMediaPaths)
    ? data.privateMediaPaths.filter((p): p is string => typeof p === "string" && p.startsWith("submissions/private/"))
    : [];
  const media = data.media;
  if (media && typeof media === "object" && !Array.isArray(media)) {
    for (const value of Object.values(media as Record<string, unknown>)) {
      if (typeof value === "string" && value.startsWith("submissions/private/") && !paths.includes(value)) {
        paths.push(value);
      }
    }
  }
  const files: PendingFile[] = [];
  for (const storagePath of paths.slice(0, 8)) {
    let contentType = "";
    try {
      contentType = await privateObjectContentType(storagePath);
    } catch {
      contentType = "";
    }
    if (isDeclaredHeic(storagePath, contentType)) {
      files.push({ url: "", kind: "heic", storagePath });
      continue;
    }
    try {
      files.push({ url: await signReadUrlForPath(storagePath), kind: fileKind(storagePath, type) });
    } catch {
      files.push({ url: "", kind: fileKind(storagePath, type) });
    }
  }
  if (media && typeof media === "object" && !Array.isArray(media)) {
    for (const value of Object.values(media as Record<string, unknown>)) {
      if (typeof value !== "string") continue;
      const url = value.trim();
      if (!url.startsWith("https://") && !url.startsWith("http://")) continue;
      if (isDeclaredHeic(url)) {
        const storagePath = extractPrivateStoragePathFromUrl(url);
        if (storagePath && files.some((file) => file.storagePath === storagePath)) continue;
        files.push({ url: "", kind: "heic", ...(storagePath ? { storagePath } : {}) });
        continue;
      }
      const storagePath = extractPrivateStoragePathFromUrl(url);
      if (storagePath && files.some((file) => file.storagePath === storagePath)) continue;
      files.push({ url, kind: fileKind(url, type) });
    }
  }
  return files.slice(0, 8);
}

function personFields(data: Record<string, unknown>, email: string) {
  const ageId = textField(data, "ageRange");
  const sexId = textField(data, "sex");
  return {
    alias: textField(data, "alias", "authorName"),
    country: textField(data, "country", "countryLabel"),
    city: textField(data, "city", "cityLabel", "placeLabel", "place"),
    age: AGE_LABEL.get(ageId as (typeof AGE_RANGE_OPTIONS)[number]["id"]) ?? "",
    gender: SEX_LABEL[sexId] ?? "",
    email,
  };
}

async function profilePhotoForAdmin(data: Record<string, unknown>) {
  const raw = textField(data, "profilePhotoUrl");
  const storedPath = textField(data, "profilePhotoPath");
  const path = storedPath.startsWith("submissions/private/")
    ? storedPath
    : raw.startsWith("submissions/private/")
      ? raw
      : extractPrivateStoragePathFromUrl(raw) || "";
  if (path.startsWith("submissions/private/")) {
    const heic = isDeclaredHeic(path);
    try {
      return {
        profilePhotoUrl: heic ? "" : await signReadUrlForPath(path),
        profilePhotoPath: path,
        profilePhotoHeic: heic,
      };
    } catch {
      return { profilePhotoUrl: "", profilePhotoPath: path, profilePhotoHeic: heic };
    }
  }
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    return { profilePhotoUrl: raw, profilePhotoPath: "", profilePhotoHeic: isDeclaredHeic(raw) };
  }
  return { profilePhotoUrl: "", profilePhotoPath: "", profilePhotoHeic: false };
}

function pendingRow(
  id: string,
  data: Record<string, unknown>,
  source: PendingSource,
  files: PendingFile[]
) {
  const type = textField(data, "type", "format") || "texto";
  const email = textField(data, "email", "authorEmail");
  const lat = typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : null;
  const lng = typeof data.lng === "number" && Number.isFinite(data.lng) ? data.lng : null;
  const consent = consentRowsFromRecord(data);
  return {
    id,
    title: textField(data, "storyTitle", "title"),
    alias: textField(data, "alias", "authorName"),
    place: textField(data, "placeLabel", "place", "city"),
    lat,
    lng,
    format: submissionFormat(type),
    mediaUrl: files.find((f) => f.url)?.url ?? "",
    topic: [],
    status: "pending" as const,
    activeSince: null,
    isFeatured: false,
    resonances: 0,
    createdAt: toMillis(data.createdAt),
    authorEmail: email || null,
    sender: {
      ...personFields(data, email),
      profilePhotoUrl: "",
      profilePhotoPath: "",
      profilePhotoHeic: false,
    },
    consents: consent.rows,
    consentTextsVersion: consent.version,
    rightsAccepted: data.consentPublicacion === true || Boolean(data.consent),
    publicationMail: null,
    questionId: typeof data.questionId === "string" ? data.questionId : null,
    questionMode: data.questionMode === "tu" || data.questionMode === "alguien" ? data.questionMode : null,
    text: submissionFormat(type) === "text" ? relatoOf(data, source) : "",
    antecedentes: textField(data, "antecedentes"),
    cancionRelacionada: textField(data, "cancionRelacionada"),
    imagenes: imagenesOf(data, source),
    files,
    source,
  };
}

/** Envíos pendientes de submissions y de la colección antigua story_submissions. */
async function listPendingSubmissions() {
  const db = getAdminDb();
  const [current, legacy] = await Promise.all([
    db.collection("submissions").where("status", "==", "pending").limit(200).get(),
    db.collection("story_submissions").where("status", "==", "pending").limit(200).get(),
  ]);
  const rows = await Promise.all([
    ...current.docs.map(async (doc) => {
      const data = doc.data() as Record<string, unknown>;
      const type = textField(data, "type", "format") || "texto";
      const row = pendingRow(doc.id, data, "submissions", await filesForSubmission(data, type));
      return { ...row, sender: { ...row.sender, ...(await profilePhotoForAdmin(data)) } };
    }),
    ...legacy.docs.map(async (doc) => {
      const data = doc.data() as Record<string, unknown>;
      const type = textField(data, "format", "type") || "text";
      const row = pendingRow(doc.id, data, "story_submissions", await filesForSubmission(data, type));
      return { ...row, sender: { ...row.sender, ...(await profilePhotoForAdmin(data)) } };
    }),
  ]);
  rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return rows.slice(0, 200);
}

/** GET /api/admin/stories?status=pending|active|archived|rejected */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get("status") as StoryStatus | null;
  if (!status || !["pending", "active", "archived", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    if (status === "pending") {
      const stories = await listPendingSubmissions();
      return NextResponse.json({ stories });
    }

    const db = getAdminDb();
    const col = db.collection("stories");
    const snap =
      status === "active"
        ? await col
            .where("status", "in", [...FIRESTORE_AUDIENCE_PUBLIC_STATUSES])
            .orderBy("createdAt", "desc")
            .limit(200)
            .get()
        : await col
            .where("status", "==", status)
            .orderBy("createdAt", "desc")
            .limit(200)
            .get();

    const contactSnaps = snap.docs.length
      ? await db.getAll(
          ...snap.docs.map((doc) => db.collection(AUTHOR_CONTACTS_COLLECTION).doc(doc.id))
        )
      : [];
    const emailByStory = new Map<string, string>();
    for (const contact of contactSnaps) {
      const email = contact.get("email");
      if (contact.exists && typeof email === "string" && email.trim()) {
        emailByStory.set(contact.id, email.trim());
      }
    }

    const sourceRefs = [];
    const sourceStoryIds: string[] = [];
    for (const doc of snap.docs) {
      const submissionId = doc.get("sourceSubmissionId");
      const collection = doc.get("sourceSubmissionCollection");
      if (
        typeof submissionId === "string" &&
        (collection === "submissions" || collection === "story_submissions")
      ) {
        sourceRefs.push(db.collection(collection).doc(submissionId));
        sourceStoryIds.push(doc.id);
      }
    }
    const sourceSnaps = sourceRefs.length ? await db.getAll(...sourceRefs) : [];
    const sourceByStory = new Map<string, Record<string, unknown>>();
    sourceSnaps.forEach((sourceDoc, index) => {
      if (sourceDoc.exists) sourceByStory.set(sourceStoryIds[index], sourceDoc.data() as Record<string, unknown>);
    });

    const list = await Promise.all(snap.docs.map(async (doc) => {
      const d = doc.data();
      const createdAt = toMillis(d.createdAt);
      const activeSince = toMillis(d.activeSince);
      const source = sourceByStory.get(doc.id);
      const email =
        emailByStory.get(doc.id) ??
        authorEmailOnStory(d) ??
        (source ? textField(source, "email", "authorEmail") : "") ??
        "";
      const personSource: Record<string, unknown> = source ?? {
        alias: typeof d.authorName === "string" ? d.authorName : d.alias,
        authorName: d.authorName,
        country: d.country,
        city: d.city,
        placeLabel: d.placeLabel ?? d.place,
        profilePhotoUrl: d.profilePhotoUrl,
      };
      const consent = consentRowsFromRecord(source ?? {});
      const profile = await profilePhotoForAdmin(personSource);
      return {
        id: doc.id,
        title: (d.title as string | undefined) ?? (d.titulo as string | undefined) ?? "",
        alias: textField(personSource, "alias", "authorName") || (typeof d.alias === "string" ? d.alias : ""),
        place: d.place ?? d.placeLabel ?? "",
        lat: d.lat ?? null,
        lng: d.lng ?? null,
        format: d.format ?? "text",
        mediaUrl: d.mediaUrl ?? (d.media as { videoUrl?: string; audioUrl?: string })?.videoUrl ?? (d.media as { videoUrl?: string; audioUrl?: string })?.audioUrl ?? "",
        topic: Array.isArray(d.topic) ? d.topic : (d.tags as { themes?: string[] })?.themes ?? [],
        status: d.status ?? "pending",
        activeSince,
        isFeatured: Boolean(d.isFeatured),
        resonances: typeof d.resonances === "number" ? d.resonances : 0,
        createdAt,
        authorEmail: email || null,
        sender: { ...personFields(personSource, email), ...profile },
        consents: consent.rows,
        consentTextsVersion: consent.version,
        rightsAccepted: Boolean(d.rightsAccepted),
        publicationMail: d.publicationMail ?? null,
        questionId: typeof d.questionId === "string" ? d.questionId : null,
        questionMode: d.questionMode === "tu" || d.questionMode === "alguien" ? d.questionMode : null,
        text: typeof d.text === "string" ? d.text : "",
        antecedentes: typeof d.antecedentes === "string" ? d.antecedentes : "",
        cancionRelacionada: typeof d.cancionRelacionada === "string" ? d.cancionRelacionada : "",
        imagenes: (parseStoryImagenes(d.imagenes) ?? []).map(imagenFromParsed),
      };
    }));

    return NextResponse.json({ stories: list });
  } catch (e) {
    console.error("[admin/stories GET]", e);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
