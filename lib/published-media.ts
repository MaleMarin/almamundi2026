/**
 * Pasa media privada (enlaces firmados de 30 min) a URLs públicas de /published/**.
 */
import "server-only";
import { copyPrivateSubmissionToPublished } from "@/lib/server-storage";
import type { StoryImagen } from "@/lib/historias/story-imagenes";

const PRIVATE_PREFIX = "submissions/private/";

export function extractPrivateStoragePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let objectPath = "";
    if (u.hostname === "firebasestorage.googleapis.com") {
      const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
      if (!m?.[1]) return null;
      objectPath = decodeURIComponent(m[1]);
    } else if (u.hostname === "storage.googleapis.com") {
      const parts = u.pathname.replace(/^\//, "").split("/");
      if (parts.length < 2) return null;
      objectPath = parts.slice(1).join("/");
    } else if (u.hostname.endsWith(".storage.googleapis.com")) {
      objectPath = u.pathname.replace(/^\//, "");
    } else {
      return null;
    }
    objectPath = objectPath.replace(/^\/+/, "");
    if (!objectPath.startsWith(PRIVATE_PREFIX)) return null;
    if (objectPath.includes("\0") || objectPath.includes("..")) return null;
    return objectPath;
  } catch {
    return null;
  }
}

function urlMentionsPath(url: string, storagePath: string): boolean {
  return url.includes(storagePath) || url.includes(encodeURIComponent(storagePath));
}

export function collectPrivatePathsForPublicUrls(
  urls: Array<string | undefined | null>,
  privateMediaPaths?: unknown
): string[] {
  const publicUrls = urls.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
  const out = new Set<string>();
  for (const url of publicUrls) {
    const extracted = extractPrivateStoragePathFromUrl(url);
    if (extracted) out.add(extracted);
  }
  if (Array.isArray(privateMediaPaths)) {
    for (const raw of privateMediaPaths) {
      if (typeof raw !== "string") continue;
      const path = raw.trim();
      if (!path.startsWith(PRIVATE_PREFIX)) continue;
      if (publicUrls.some((url) => urlMentionsPath(url, path))) {
        out.add(path);
      }
    }
  }
  return [...out];
}

export function rewritePrivateMediaUrl(
  url: string,
  pathToPublic: Map<string, string>
): string {
  const path = extractPrivateStoragePathFromUrl(url);
  if (!path) return url;
  const published = pathToPublic.get(path);
  if (!published) {
    throw new Error(`media_not_promoted:${path}`);
  }
  return published;
}

function rewriteOptionalUrl(
  url: string | undefined,
  pathToPublic: Map<string, string>
): string | undefined {
  if (typeof url !== "string" || !url.trim()) return url;
  return rewritePrivateMediaUrl(url.trim(), pathToPublic);
}

export type PublicMediaBag = {
  media?: Record<string, string>;
  imagenes?: StoryImagen[];
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  images?: string[];
  profilePhotoUrl?: string;
};

export async function promotePublicStoryMedia(opts: {
  storyId: string;
  privateMediaPaths?: unknown;
  bag: PublicMediaBag;
}): Promise<PublicMediaBag & { publishedMediaPaths: string[] }> {
  const { bag } = opts;
  const urls: Array<string | undefined> = [
    bag.videoUrl,
    bag.audioUrl,
    bag.imageUrl,
    bag.profilePhotoUrl,
    ...(bag.images ?? []),
    ...(bag.imagenes?.map((im) => im.url) ?? []),
    ...Object.values(bag.media ?? {}),
  ];
  const paths = collectPrivatePathsForPublicUrls(urls, opts.privateMediaPaths);
  const pathToPublic = new Map<string, string>();
  const publishedMediaPaths: string[] = [];
  for (const sourcePath of paths) {
    const copied = await copyPrivateSubmissionToPublished({
      sourcePath,
      storyId: opts.storyId,
    });
    pathToPublic.set(sourcePath, copied.publicUrl);
    publishedMediaPaths.push(copied.storagePath);
  }

  const media = bag.media
    ? Object.fromEntries(
        Object.entries(bag.media)
          .filter(([, v]) => typeof v === "string" && v.trim())
          .map(([k, v]) => [k, rewritePrivateMediaUrl(v, pathToPublic)])
      )
    : undefined;

  return {
    media,
    imagenes: bag.imagenes?.map((im) => ({
      ...im,
      url: rewritePrivateMediaUrl(im.url, pathToPublic),
    })),
    videoUrl: rewriteOptionalUrl(bag.videoUrl, pathToPublic),
    audioUrl: rewriteOptionalUrl(bag.audioUrl, pathToPublic),
    imageUrl: rewriteOptionalUrl(bag.imageUrl, pathToPublic),
    images: bag.images?.map((u) => rewritePrivateMediaUrl(u, pathToPublic)),
    profilePhotoUrl: rewriteOptionalUrl(bag.profilePhotoUrl, pathToPublic),
    publishedMediaPaths,
  };
}
