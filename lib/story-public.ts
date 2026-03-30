/**
 * Estados de historia visibles públicamente en API y páginas.
 * No exponer borradores, pendientes de curación ni rechazados.
 */
export const PUBLIC_STORY_STATUSES = ["published"] as const;
export type PublicStoryStatus = (typeof PUBLIC_STORY_STATUSES)[number];

export function isPublicStoryDocumentStatus(status: unknown): status is PublicStoryStatus {
  return typeof status === "string" && (PUBLIC_STORY_STATUSES as readonly string[]).includes(status);
}
