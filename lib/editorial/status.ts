/**
 * Estados editoriales canónicos para historias públicas (`stories`) y política de visibilidad.
 * Mantener compatibilidad con valores legacy en Firestore (`published`, `active`).
 */

/** Estados oficiales (documentación / transiciones nuevas). */
export const CANONICAL_STORY_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "archived",
  "featured",
  "beta_demo",
] as const;
export type CanonicalStoryStatus = (typeof CANONICAL_STORY_STATUSES)[number];

/**
 * Estados que la audiencia general puede ver (listados, `/api/stories`, detalle público sin privilegio).
 * Incluye alias legacy escritos antes de esta capa editorial.
 */
export const AUDIENCE_PUBLIC_STORY_STATUSES = [
  "approved",
  "featured",
  "beta_demo",
  /** @deprecated usar `approved` en escrituras nuevas */
  "published",
  /** @deprecated panel admin antiguo; tratar como visible */
  "active",
] as const;
export type AudiencePublicStoryStatus = (typeof AUDIENCE_PUBLIC_STORY_STATUSES)[number];

/** Para queries Firestore (`where status in (...)`) sin superar límites; mismo orden estable. */
export const FIRESTORE_AUDIENCE_PUBLIC_STATUSES: readonly AudiencePublicStoryStatus[] = [
  "approved",
  "featured",
  "beta_demo",
  "published",
  "active",
];

export function isAudiencePublicStoryStatus(status: unknown): status is AudiencePublicStoryStatus {
  return (
    typeof status === "string" &&
    (FIRESTORE_AUDIENCE_PUBLIC_STATUSES as readonly string[]).includes(status)
  );
}

/** Historia puede mostrarse en detalle/lista pública sin credenciales. */
export function isPublicStoryVisibleForAudience(status: unknown): boolean {
  return isAudiencePublicStoryStatus(status);
}

/**
 * Solo puntos del globo `/api/stories`: visible para audiencia y con coordenadas válidas en el doc plano.
 * (Las historias españolas pueden llevar coords en `ubicacion`; usar `resolveStoryLatLng` al mapear.)
 */
export function isGlobePointEligibleFromFlatLatLng(doc: {
  status?: unknown;
  lat?: unknown;
  lng?: unknown;
}): boolean {
  if (!isAudiencePublicStoryStatus(doc.status)) return false;
  const lat = doc.lat != null ? Number(doc.lat) : NaN;
  const lng = doc.lng != null ? Number(doc.lng) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function isBetaDemoStatus(status: unknown): boolean {
  return status === "beta_demo";
}

/** Compatibilidad con import previo `@/lib/story-public`. */
export function isPublicStoryDocumentStatus(status: unknown): boolean {
  return isAudiencePublicStoryStatus(status);
}
