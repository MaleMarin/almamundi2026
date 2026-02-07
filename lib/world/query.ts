/**
 * Lectura de world_items. Sin ingest.
 */
import { Timestamp, type CollectionReference, type DocumentSnapshot } from "firebase-admin/firestore";
import type { WorldItemSerialized, Mode } from "./types";

function toIso(t: unknown): string {
  if (t instanceof Timestamp) return t.toDate().toISOString();
  if (t && typeof t === "object" && "toDate" in t && typeof (t as { toDate: () => Date }).toDate === "function") {
    return (t as { toDate: () => Date }).toDate().toISOString();
  }
  if (t && typeof t === "object" && "_seconds" in t) {
    return new Date((t as { _seconds: number })._seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

function serialize(doc: DocumentSnapshot): WorldItemSerialized {
  const d = doc.data()!;
  const id = doc.id;
  return {
    id,
    kind: d.kind,
    title: d.title,
    summary: d.summary,
    publishedAt: toIso(d.publishedAt),
    ingestedAt: toIso(d.ingestedAt),
    fields: d.fields ?? [],
    intensity: d.intensity ?? 0,
    sources: (d.sources ?? []).map((s: { name: string; url: string; publishedAt: unknown }) => ({
      name: s.name,
      url: s.url,
      publishedAt: toIso(s.publishedAt),
    })),
    sourceCount: d.sourceCount ?? 0,
    dedupeKey: d.dedupeKey ?? "",
    isActive: d.isActive !== false,
  };
}

export type QueryWorldOptions = {
  mode: Mode;
  limit: number;
  field?: string;
};

export async function queryWorld(col: CollectionReference, opts: QueryWorldOptions): Promise<WorldItemSerialized[]> {
  const now = new Date();
  const cutoff =
    opts.mode === "now"
      ? new Date(now.getTime() - 2 * 60 * 60 * 1000)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const cutoffTimestamp = Timestamp.fromDate(cutoff);

  if (opts.field) {
    const snap = await col
      .where("kind", "==", "news")
      .where("isActive", "==", true)
      .where("fields", "array-contains", opts.field)
      .where("publishedAt", ">=", cutoffTimestamp)
      .orderBy("publishedAt", "desc")
      .limit(opts.limit)
      .get();
    return snap.docs.map(serialize);
  }

  const snap = await col
    .where("kind", "==", "news")
    .where("isActive", "==", true)
    .where("publishedAt", ">=", cutoffTimestamp)
    .orderBy("publishedAt", "desc")
    .limit(opts.limit)
    .get();
  return snap.docs.map(serialize);
}
