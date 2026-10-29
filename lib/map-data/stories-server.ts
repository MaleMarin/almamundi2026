/**
 * Solo servidor: lee historias desde Firestore.
 * Usar solo en API routes o Server Components.
 * El cliente usa getStoryById / getStories desde stories.ts (sin Firebase).
 *
 * Índice compuesto requerido: stories (status IN audience_public + publishedAt DESC).
 * El globo muestra las 40 aprobadas más recientes con coordenadas, más las destacadas.
 */
import "server-only";
import type { DocumentData } from "firebase-admin/firestore";
import type { StoryPoint } from "@/lib/map-data/stories";
import { normalizeCancionRelacionada } from "@/lib/cancion-relacionada";
import { normalizeAntecedentes, omitAntecedentesFromPublicText } from "@/lib/antecedentes";
import { publicCityCountry } from "@/lib/historias/story-ubicacion";
import { isQuestionMode, resolveQuestionId } from "@/lib/pregunta-semana";
import { parseStoryImagenes } from "@/lib/historias/story-imagenes";
import {
  FIRESTORE_AUDIENCE_PUBLIC_STATUSES,
  GLOBE_PUBLIC_STORY_CAP,
  isAudiencePublicStoryStatus,
} from "@/lib/editorial/status";
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
  const note = normalizeAntecedentes(d.antecedentes);
  const rawText = ((d.text as string) ?? (d.texto as string) ?? "") || "";
  const text = omitAntecedentesFromPublicText(rawText, note);
  const excerpt = omitAntecedentesFromPublicText((d.excerpt as string) ?? "", note) || undefined;
  const quote = omitAntecedentesFromPublicText((d.quote as string) ?? "", note) || undefined;
  const descripcion = omitAntecedentesFromPublicText((d.descripcion as string) ?? "", note) || undefined;
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

  const cityRaw =
    ((d.city as string) ?? "").trim() ||
    ((d.placeLabel as string) ?? "").trim() ||
    (((d.ubicacion as { ciudad?: string } | undefined)?.ciudad ?? "") ||
      "");

  const countryRaw =
    ((d.country as string) ?? "").trim() ||
    (((d.ubicacion as { pais?: string } | undefined)?.pais ?? "") ||
      "");
  const place = publicCityCountry(cityRaw, countryRaw);
  const city = place.city ?? "";
  const country = place.country ?? "";

  const formato = (d.format as string | undefined) ?? (d.formato as string | undefined);
  const topic =
    ((d.tags as { themes?: string[] } | undefined)?.themes?.[0] ??
      ((d.temas as string[] | undefined)?.[0] ?? undefined)) ||
    ((d.topic as string) ?? undefined);

  const isBetaDemo = String(status) === "beta_demo";

  const latOut = globeOnly ? (lat as number) : lat ?? 0;
  const lngOut = globeOnly ? (lng as number) : lng ?? 0;

  const accessibility = storyAccessibilityFieldsFromRecord(d);
  const questionId = resolveQuestionId(d.questionId);

  const base: StoryPoint = {
    id,
    lat: latOut,
    lng: lngOut,
    label: title,
    authorName: authorNameRaw || undefined,
    authorAvatar:
      (typeof d.authorAvatar === "string" && d.authorAvatar.trim()) ||
      (typeof d.profilePhotoUrl === "string" && d.profilePhotoUrl.trim()) ||
      undefined,
    title,
    description: excerpt ?? descripcion ?? (text ? String(text).slice(0, 200) : undefined),
    excerpt,
    quote,
    cancionRelacionada: normalizeCancionRelacionada(d.cancionRelacionada),
    ...(questionId ? { questionId } : {}),
    ...(isQuestionMode(d.questionMode) ? { questionMode: d.questionMode } : {}),
    imagenes: parseStoryImagenes(d.imagenes),
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
    isRealStory: !isBetaDemo,
    ...accessibility,
  };

  return base;
}

function isDestacadaRecord(d: Record<string, unknown>): boolean {
  return d.status === "featured" || d.isFeatured === true;
}

function publishedMillis(d: Record<string, unknown>): number {
  const iso = publishedAtIso(d);
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

async function loadAudienceStoryDocs(): Promise<{ id: string; data: Record<string, unknown> }[]> {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  const db = getAdminDb();
  const snap = await db
    .collection("stories")
    .where("status", "in", [...FIRESTORE_AUDIENCE_PUBLIC_STATUSES])
    .orderBy("publishedAt", "desc")
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }));
}

function globeStoryIds(docs: { id: string; data: Record<string, unknown> }[]): Set<string> {
  const withGeo = docs.filter((doc) => {
    const { lat, lng } = resolveLatLng(doc.data);
    if (lat == null || lng == null) {
      console.warn(`[getStoriesAsync] Historia aprobada sin coordenadas, omitida del globo: ${doc.id}`);
      return false;
    }
    return true;
  });
  const ordered = [...withGeo].sort((a, b) => publishedMillis(b.data) - publishedMillis(a.data));
  const recent = ordered.slice(0, GLOBE_PUBLIC_STORY_CAP);
  const ids = new Set(recent.map((doc) => doc.id));
  for (const doc of ordered) {
    if (isDestacadaRecord(doc.data)) ids.add(doc.id);
  }
  return ids;
}

export async function getStoriesAsync(): Promise<StoryPoint[]> {
  try {
    const docs = await loadAudienceStoryDocs();
    const ids = globeStoryIds(docs);
    const stories: StoryPoint[] = [];
    for (const doc of docs) {
      if (!ids.has(doc.id)) continue;
      const point = firestoreDocToStoryPoint(doc.id, doc.data, true);
      if (!point) continue;
      point.featured = isDestacadaRecord(doc.data);
      point.onGlobe = true;
      stories.push(point);
    }
    stories.sort((a, b) => (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0));
    return stories;
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

/** Todas las historias públicas, en el globo o no. Sin el texto del relato. */
export async function getPublicCatalogAsync(): Promise<StoryPoint[]> {
  try {
    const docs = await loadAudienceStoryDocs();
    const onGlobe = globeStoryIds(docs);
    const stories: StoryPoint[] = [];
    for (const doc of docs) {
      const point = firestoreDocToStoryPoint(doc.id, doc.data, false);
      if (!point) continue;
      point.featured = isDestacadaRecord(doc.data);
      point.onGlobe = onGlobe.has(doc.id);
      point.body = undefined;
      point.excerpt = undefined;
      point.quote = undefined;
      point.description = undefined;
      point.transcription = undefined;
      stories.push(point);
    }
    stories.sort((a, b) => (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0));
    return stories;
  } catch (err) {
    console.error("[getPublicCatalogAsync]", err);
    return [];
  }
}

export type GetStoryByIdOptions = {
  /** Si true, permite devolver documentos no visibles para audiencia (admin/curaduría con token). */
  privilegedReader?: boolean;
};

/** Obtiene una historia por id: audiencia general solo ve estados públicos canónicos + legacy. */
export async function getStoryByIdAsync(
  id: string,
  opts: GetStoryByIdOptions = {}
): Promise<StoryPoint | null> {
  if (!id) return null;
  const { privilegedReader = false } = opts;
  try {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();
    const doc = await db.collection("stories").doc(id).get();
    if (!doc.exists) return null;
    const d = doc.data() as Record<string, unknown>;
    if (!privilegedReader && !isAudiencePublicStoryStatus(d.status)) {
      return null;
    }
    return firestoreDocToStoryPoint(doc.id, d, false);
  } catch (err) {
    console.error("[getStoryByIdAsync]", err);
    return null;
  }
}
