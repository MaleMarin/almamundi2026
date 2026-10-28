export const RESPUESTAS_COLLECTION = "respuestas";
export const RESPUESTA_CONTACTS_COLLECTION = "respuesta_contacts";

export const RESPUESTA_TEXT_MAX = 1000;
export const RESPUESTA_CAPTION_MAX = 200;
export const RESPUESTA_VOICE_MAX_SECONDS = 120;
export const RESPUESTA_VOICE_MAX_BYTES = 5 * 1024 * 1024;
export const RESPUESTA_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const RESPUESTA_KINDS = ["texto", "voz", "foto"] as const;
export type RespuestaKind = (typeof RESPUESTA_KINDS)[number];

export const RESPUESTA_STATUSES = ["pending", "approved", "rejected", "archived"] as const;
export type RespuestaStatus = (typeof RESPUESTA_STATUSES)[number];

/** Path que devuelve savePrivateSubmissionObject. */
export const RESPUESTA_PRIVATE_PATH =
  /^submissions\/private\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[^/]+$/i;

export function isRespuestaKind(value: unknown): value is RespuestaKind {
  return value === "texto" || value === "voz" || value === "foto";
}

export function isRespuestaStatus(value: unknown): value is RespuestaStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "archived"
  );
}
