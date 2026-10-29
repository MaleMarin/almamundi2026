import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { FIRESTORE_AUDIENCE_PUBLIC_STATUSES } from "@/lib/editorial/status";
import { parseStoryImagenes } from "@/lib/historias/story-imagenes";
import { AUTHOR_CONTACTS_COLLECTION, authorEmailOnStory } from "@/lib/author-contacts";
import { signReadUrlForPath } from "@/lib/server-storage";

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

type PendingFile = { url: string; kind: "image" | "audio" | "video" | "file" };

function submissionFormat(type: unknown): "video" | "audio" | "text" | "photos" {
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  if (type === "foto" || type === "photo" || type === "fotos") return "photos";
  return "text";
}

function fileKind(path: string, type: string): PendingFile["kind"] {
  const lower = path.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|heic|heif)$/.test(lower)) return "image";
  if (/\.(mp3|m4a|wav|ogg|aac)$/.test(lower)) return "audio";
  if (/\.(mp4|mov|webm)$/.test(lower)) {
    if (type === "audio") return "audio";
    if (type === "video") return "video";
    return lower.endsWith(".webm") ? "audio" : "video";
  }
  return "file";
}

/** Envíos de /api/submissions que aún no son historias publicadas. */
async function listPendingSubmissions() {
  const db = getAdminDb();
  const snap = await db.collection("submissions").where("status", "==", "pending").limit(200).get();
  const rows = await Promise.all(
    snap.docs.map(async (doc) => {
      const d = doc.data() as Record<string, unknown>;
      const type = typeof d.type === "string" ? d.type : "texto";
      const paths = Array.isArray(d.privateMediaPaths)
        ? d.privateMediaPaths.filter((p): p is string => typeof p === "string" && p.startsWith("submissions/private/"))
        : [];
      const files: PendingFile[] = [];
      for (const storagePath of paths.slice(0, 8)) {
        try {
          files.push({ url: await signReadUrlForPath(storagePath), kind: fileKind(storagePath, type) });
        } catch {
          files.push({ url: "", kind: fileKind(storagePath, type) });
        }
      }
      const createdAt = toMillis(d.createdAt);
      const place = typeof d.placeLabel === "string" ? d.placeLabel : "";
      const email = typeof d.email === "string" ? d.email.trim() : "";
      return {
        id: doc.id,
        title: typeof d.storyTitle === "string" ? d.storyTitle : "",
        alias: typeof d.alias === "string" ? d.alias : "",
        place,
        lat: null,
        lng: null,
        format: submissionFormat(type),
        mediaUrl: files.find((f) => f.url)?.url ?? "",
        topic: [],
        status: "pending" as const,
        activeSince: null,
        isFeatured: false,
        resonances: 0,
        createdAt,
        authorEmail: email || null,
        rightsAccepted: Boolean(d.consentPublicacion),
        publicationMail: null,
        questionId: typeof d.questionId === "string" ? d.questionId : null,
        questionMode: d.questionMode === "tu" || d.questionMode === "alguien" ? d.questionMode : null,
        imagenes: [],
        files,
        source: "submissions" as const,
      };
    })
  );
  rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return rows;
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
