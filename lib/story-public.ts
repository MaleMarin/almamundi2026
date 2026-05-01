/**
 * Política de visibilidad pública para documentos historia (compatibilidad).
 * Fuente única de verdad: `@/lib/editorial/status`.
 */
export {
  isAudiencePublicStoryStatus,
  FIRESTORE_AUDIENCE_PUBLIC_STATUSES,
  AUDIENCE_PUBLIC_STORY_STATUSES,
  isPublicStoryDocumentStatus,
  isGlobePointEligibleFromFlatLatLng as isGlobeEligibleFlatCoords,
  isBetaDemoStatus,
} from "@/lib/editorial/status";
