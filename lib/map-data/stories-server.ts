/**
 * Solo servidor: lee historias desde Firestore.
 * Usar solo en API routes o Server Components.
 * El cliente usa getStoryById / getStories desde stories.ts (sin Firebase).
 *
 * Índice compuesto requerido: stories (status IN audience_public + publishedAt DESC).
 * Despliega índices: firebase deploy --only firestore:indexes
 */
import "server-only";
import type { DocumentData } from "firebase-admin/firestore";
import { getDemoStoryPointById } from "@/lib/historias/historias-demo-stories";
import type { StoryPoint } from "@/lib/map-data/stories";
import {
  FIRESTORE_AUDIENCE_PUBLIC_STATUSES,
  isAudiencePublicStoryStatus,
} from "@/lib/editorial/status";
import {
  annotatePublicFirestoreStory,
  DEMO_STORY_NOTICE,
  showPublicDemoStories,
} from "@/lib/demo-stories-public";
import { storyAccessibilityFieldsFromRecord } from "@/lib/historias/story-accessibility";

function publishedAtIso(d: Record<string, unknown>): string | undefined {
  const p = d.publishedAt;
  if (p && typeof (p as { toDate?: () => Date }).toDate === "function") {
    return (p as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof p === "string" && p.trim()) return p;
  return undefined;
}

function resolveLatLng(d: Record<string, unknown>): { lat: number | null; lng: number | null } {
  let lat = d.lat != null ? Number(d.lat) : null;
  let lng = d.lng != null ? Number(d.lng) : null;
  const u = d.ubicacion as { lat?: unknown; lng?: unknown } | undefined;
  if ((lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) && u) {
    const ul = u.lat != null ? Number(u.lat) : null;
    const ug = u.lng != null ? Number(u.lng) : null;
    if (ul != null && ug != null && Number.isFinite(ul) && Number.isFinite(ug)) {
      lat = ul;
      lng = ug;
    }
  }
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: null, lng: null };
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { lat: null, lng: null };
  return { lat, lng };
}

function mediaFromDoc(d: Record<string, unknown>): Record<string, string | null | undefined> {
  const base = ((d.media as Record<string, string | null | undefined>) ?? {}) ?? {};
  const out: Record<string, string | null | undefined> = { ...base };
  if (!out.videoUrl && typeof d.videoUrl === "string") out.videoUrl = d.videoUrl;
  if (!out.audioUrl && typeof d.audioUrl === "string") out.audioUrl = d.audioUrl;
  if (!out.imageUrl && typeof d.imageUrl === "string") out.imageUrl = d.imageUrl;
  return out;
}

/**
 * Normaliza snapshot `stories` → StoryPoint (mapa/detalle inglés/español).
 * Si `globeOnly`, exige coords válidas para pin (además de audiencia + estado público revisado antes).
 */
function firestoreDocToStoryPoint(
  id: string,
  dRaw: DocumentData,
  globeOnly: boolean
): StoryPoint | null {
  const d = dRaw as Record<string, unknown>;
  const status = d.status;

  const title =
    ((d.title as string) ?? "").trim() ||
    ((d.titulo as string) ?? "").trim() ||
    "Historia";
  const text = ((d.text as string) ?? (d.texto as string) ?? "") || "";
  const media = mediaFromDoc(d);
  const { lat, lng } = resolveLatLng(d);
  if (globeOnly) {
    if (!isAudiencePublicStoryStatus(status)) return null;
    if (lat == null || lng == null) return null;
  }

  const publishedAt = publishedAtIso(d);
  const thumb = (d.thumbnailUrl as string | undefined) ?? undefined;
  const mediaImage = (media.imageUrl as string | undefined) ?? undefined;
  const imageUrl = thumb || mediaImage;

  const authorNameRaw =
    (d.authorName as string | undefined) ??
    (((d.autor as { nombre?: string } | undefined)?.nombre ?? "") ||
      "");

  const city =
    ((d.city as string) ?? "").trim() ||
    (((d.ubicacion as { ciudad?: string } | undefined)?.ciudad ?? "") ||
      "");

  const country =
    ((d.country as string) ?? "").trim() ||
    (((d.ubicacion as { pais?: string } | undefined)?.pais ?? "") ||
      "");

  const formato = (d.format as string | undefined) ?? (d.formato as string | undefined);
  const topic =
    ((d.tags as { themes?: string[] } | undefined)?.themes?.[0] ??
      ((d.temas as string[] | undefined)?.[0] ?? undefined)) ||
    ((d.topic as string) ?? undefined);

  const isBetaDemo = String(status) === "beta_demo";

  const latOut = globeOnly ? (lat as number) : lat ?? 0;
  const lngOut = globeOnly ? (lng as number) : lng ?? 0;

  const accessibility = storyAccessibilityFieldsFromRecord(d);

  const base: StoryPoint = {
    id,
    lat: latOut,
    lng: lngOut,
    label: title,
    authorName: authorNameRaw || undefined,
    authorAvatar: (d.authorAvatar as string) ?? undefined,
    title,
    description: (d.excerpt as string) ?? (d.descripcion as string) ?? (text ? String(text).slice(0, 200) : undefined),
    excerpt: (d.excerpt as string) ?? undefined,
    quote: (d.quote as string) ?? undefined,
    format: formato,
    city: city || undefined,
    country: country || undefined,
    topic,
    audioUrl: (media.audioUrl as string | undefined) ?? undefined,
    videoUrl: (media.videoUrl as string | undefined) ?? undefined,
    body: text || undefined,
    hasText: Boolean(text),
    hasAudio: Boolean(media.audioUrl),
    hasVideo: Boolean(media.videoUrl || d.videoUrl),
    publishedAt,
    imageUrl,
    thumbnailUrl: thumb || mediaImage,
    weatherTags: (d.weatherTags as string[] | undefined) ?? undefined,
    isBetaDemo: isBetaDemo ? true : undefined,
    editorialStatus: typeof status === "string" ? status : undefined,
    ...accessibility,
  };

  if (isBetaDemo) {
    return annotatePublicFirestoreStory({
      ...base,
      isDemo: true,
      demoNotice: DEMO_STORY_NOTICE,
    });
  }
  return annotatePublicFirestoreStory({ ...base, isRealStory: true });
}

export async function getStoriesAsync(): Promise<StoryPoint[]> {
  try {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();

    const snap = await db
      .collection("stories")
      .where("status", "in", [...FIRESTORE_AUDIENCE_PUBLIC_STATUSES])
      .orderBy("publishedAt", "desc")
      .limit(64)
      .get();

    return snap.docs
      .map((doc) => firestoreDocToStoryPoint(doc.id, doc.data(), true))
      .filter((s): s is StoryPoint => s !== null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isDecoder = /DECODER routines::\s*unsupported|1E08010C/i.test(msg);
    const isIndex = /requires an index|FAILED_PRECONDITION/i.test(msg);
    if (isDecoder && typeof globalThis !== "undefined") {
      (globalThis as { _firestoreDecoderLogged?: boolean })._firestoreDecoderLogged ??= false;
      if (!(globalThis as { _firestoreDecoderLogged?: boolean })._firestoreDecoderLogged) {
        (globalThis as { _firestoreDecoderLogged?: boolean })._firestoreDecoderLogged = true;
        console.warn(
          "[getStoriesAsync] Firestore DECODER error (Node/OpenSSL). Usa Node 18 o 20 LTS. Historias en local: []."
        );
      }
    } else if (isIndex && typeof globalThis !== "undefined") {
      (globalThis as { _firestoreIndexLogged?: boolean })._firestoreIndexLogged ??= false;
      if (!(globalThis as { _firestoreIndexLogged?: boolean })._firestoreIndexLogged) {
        (globalThis as { _firestoreIndexLogged?: boolean })._firestoreIndexLogged = true;
        console.warn(
          "[getStoriesAsync] Firestore: falta índice compuesto (status IN + publishedAt). Ejecuta: firebase deploy --only firestore:indexes"
        );
      }
    } else {
      console.error("[getStoriesAsync] Firestore error:", err);
    }
    return [];
  }
}

export type GetStoryByIdOptions = {
  /** Si true, permite devolver documentos no visibles para audiencia (admin/curaduría con token). */
  privilegedReader?: boolean;
  /**
   * Relatos locales `demo-*` solo si NEXT_PUBLIC_SHOW_DEMO_STORIES=true
   * (salvo privilegedReader, donde siempre pueden resolverse para moderación si hiciera falta).
   */
  allowPublicDemos?: boolean;
};

/** Obtiene una historia por id: audiencia general solo ve estados públicos canónicos + legacy. */
export async function getStoryByIdAsync(
  id: string,
  opts: GetStoryByIdOptions = {}
): Promise<StoryPoint | null> {
  if (!id) return null;
  const { privilegedReader = false, allowPublicDemos = false } = opts;
  try {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();
    const doc = await db.collection("stories").doc(id).get();
    if (!doc.exists) {
      if (privilegedReader || (allowPublicDemos && showPublicDemoStories())) {
        const demo = getDemoStoryPointById(id);
        return demo;
      }
      return null;
    }
    const d = doc.data() as Record<string, unknown>;
    if (!privilegedReader && !isAudiencePublicStoryStatus(d.status)) {
      return null;
    }
    return firestoreDocToStoryPoint(doc.id, d, false);
  } catch (err) {
    console.error("[getStoryByIdAsync]", err);
    if (privilegedReader || (allowPublicDemos && showPublicDemoStories())) {
      const demo = getDemoStoryPointById(id);
      if (demo) return demo;
    }
    return null;
  }
}
