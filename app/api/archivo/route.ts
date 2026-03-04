/**
 * GET /api/archivo — historias archivadas (público, sin auth).
 * Para la página /archivo.
 */

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const revalidate = 60;
export const runtime = "nodejs";

function toMillis(ts: unknown): number | null {
  if (ts == null) return null;
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

function thumbnailFromDoc(d: Record<string, unknown>): string | null {
  const media = d.media as Record<string, string> | undefined;
  if (media?.imageUrl) return media.imageUrl;
  if (media?.videoUrl) return media.videoUrl; // opcional: usar frame de video
  if (d.mediaUrl && typeof d.mediaUrl === "string") {
    const url = d.mediaUrl as string;
    if (/\.(jpg|jpeg|png|gif|webp)/i.test(url)) return url;
  }
  const photos = d.photos as { url?: string }[] | undefined;
  if (Array.isArray(photos) && photos[0]?.url) return photos[0].url;
  return null;
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("stories")
      .where("status", "==", "archived")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const list = snap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = toMillis(d.createdAt);
      const media = (d.media as Record<string, string | null>) ?? {};
      const text = (d.text as string) ?? "";
      const format = (d.format as string) ?? "text";
      return {
        id: doc.id,
        title: (d.title as string) ?? "Historia",
        alias: (d.alias as string) ?? "",
        place: (d.place as string) ?? (d.placeLabel as string) ?? "",
        lat: d.lat != null ? Number(d.lat) : null,
        lng: d.lng != null ? Number(d.lng) : null,
        format,
        mediaUrl: (d.mediaUrl as string) ?? media.videoUrl ?? media.audioUrl ?? "",
        thumbnailUrl: thumbnailFromDoc(d),
        topic: Array.isArray(d.topic) ? d.topic : (d.tags as { themes?: string[] })?.themes ?? [],
        createdAt,
        city: (d.city as string) ?? undefined,
        country: (d.country as string) ?? undefined,
        body: text || undefined,
        videoUrl: media.videoUrl ?? undefined,
        audioUrl: media.audioUrl ?? undefined,
        imageUrl: media.imageUrl ?? undefined,
        photos: (d.photos as { url: string; name?: string; date?: string }[]) ?? undefined,
      };
    });

    return NextResponse.json(
      { stories: list },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (e) {
    console.error("[archivo GET]", e);
    return NextResponse.json({ error: "list failed", stories: [] }, { status: 500 });
  }
}
