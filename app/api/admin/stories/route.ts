import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { FIRESTORE_AUDIENCE_PUBLIC_STATUSES } from "@/lib/editorial/status";
import { parseStoryImagenes } from "@/lib/historias/story-imagenes";
import { AUTHOR_CONTACTS_COLLECTION, authorEmailOnStory } from "@/lib/author-contacts";
import { extractPrivateStoragePathFromUrl } from "@/lib/published-media";
import { isDeclaredHeic } from "@/lib/heic-jpeg";
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

function textField(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
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
    rightsAccepted: data.consentPublicacion === true || Boolean(data.consent),
    publicationMail: null,
    questionId: typeof data.questionId === "string" ? data.questionId : null,
    questionMode: data.questionMode === "tu" || data.questionMode === "alguien" ? data.questionMode : null,
    imagenes: [],
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
      return pendingRow(doc.id, data, "submissions", await filesForSubmission(data, type));
    }),
    ...legacy.docs.map(async (doc) => {
      const data = doc.data() as Record<string, unknown>;
      const type = textField(data, "format", "type") || "text";
      return pendingRow(doc.id, data, "story_submissions", await filesForSubmission(data, type));
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

    const list = snap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = toMillis(d.createdAt);
      const activeSince = toMillis(d.activeSince);
      return {
        id: doc.id,
        title: (d.title as string | undefined) ?? (d.titulo as string | undefined) ?? "",
        alias: d.alias ?? "",
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
        authorEmail: emailByStory.get(doc.id) ?? authorEmailOnStory(d),
        rightsAccepted: Boolean(d.rightsAccepted),
        publicationMail: d.publicationMail ?? null,
        questionId: typeof d.questionId === "string" ? d.questionId : null,
        questionMode: d.questionMode === "tu" || d.questionMode === "alguien" ? d.questionMode : null,
        imagenes: (parseStoryImagenes(d.imagenes) ?? []).map((img) => ({
          url: img.url,
          ...(img.titulo ? { titulo: img.titulo } : {}),
          ...(img.anio ? { anio: img.anio } : {}),
          ...(img.anioAprox ? { anioAprox: true } : {}),
          ...(img.lugar ? { lugar: img.lugar } : {}),
        })),
      };
    });

    return NextResponse.json({ stories: list });
  } catch (e) {
    console.error("[admin/stories GET]", e);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
