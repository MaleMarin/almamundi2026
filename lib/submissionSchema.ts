/**
 * Schema para envíos desde /subir (colección Firestore `submissions`).
 * status: pending | approved | rejected
 */

import { z } from "zod";
import { THEME_IDS } from "@/lib/themes";
import { SUBIR_TEXT_MAX_CHARS } from "@/lib/subir-limits";

const privatePathRegex =
  /^submissions\/private\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/.+$/i;

export const SubmissionType = z.enum(["video", "audio", "texto", "foto"]);
export type SubmissionType = z.infer<typeof SubmissionType>;

const themeIdsTuple = THEME_IDS as unknown as [string, ...string[]];
export const ThemeIdSchema = z.enum(themeIdsTuple);

const sexSchema = z.enum(["femenino", "masculino", "no-binario", "prefiero-no-decir"]);

export const CreateSubmissionBody = z.object({
  type: SubmissionType,
  /** Título público de la historia (mapa / fichas). */
  storyTitle: z.string().min(2, "Título mínimo 2 caracteres").max(200),
  /** Nombre de la persona / cómo figura públicamente (campo `alias` en API). */
  alias: z.string().min(2).max(120),
  email: z.string().email(),
  /** Vacío si el usuario no eligió tema en el formulario. */
  themeId: z.union([ThemeIdSchema, z.literal("")]),
  /** Vacío si no se indica fecha en el formulario. */
  date: z.string().max(200),
  dateApprox: z.boolean().optional(),
  placeLabel: z.string().min(1, "Ciudad o lugar requerido"),
  context: z.string().min(30, "Contexto mínimo 30 caracteres").max(2000),
  payload: z.object({
    textBody: z.string().max(SUBIR_TEXT_MAX_CHARS).optional(),
    photoUrl: z.string().url().optional(),
    /** Galería 1–6 imágenes; `photoUrl` suele repetir la primera para compatibilidad. */
    photoUrls: z.array(z.string().url()).max(6).optional(),
    audioUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }),
  consentRights: z.literal(true),
  consentCurate: z.literal(true),
  consentPostales: z.literal(true),
  /** Cloudflare Turnstile (opcional si TURNSTILE_SECRET_KEY está definida). */
  captchaToken: z.string().max(4000).optional(),
  /** Foto personal opcional (avatar) para mostrar junto al nombre público si se aprueba. */
  profilePhotoUrl: z.string().url().optional(),
  /** País (además de placeLabel, que suele incluir ciudad). */
  countryLabel: z.string().min(2).max(120).optional(),
  birthDate: z.string().max(80).optional(),
  sex: sexSchema.optional(),
  /** Documentos o fotos extra para curadores. */
  extraAttachmentUrls: z.array(z.string().url()).max(8).optional(),
  /** Paths en Storage (privados) asociados a esta solicitud; para re-firmar URLs en curación. */
  privateMediaPaths: z.array(z.string().regex(privatePathRegex)).max(24).optional(),
});
export type CreateSubmissionBodyType = z.infer<typeof CreateSubmissionBody>;

/** Documento en Firestore `submissions`. */
export interface SubmissionDoc {
  id?: string;
  type: "video" | "audio" | "texto" | "foto";
  status: "pending" | "approved" | "rejected";
  storyTitle: string;
  /** Nombre de la persona (cómo figura en público). */
  alias: string;
  email: string;
  themeId: string;
  date: string;
  dateApprox?: boolean;
  placeLabel: string;
  context: string;
  /** Imagen de perfil opcional subida con el envío. */
  profilePhotoUrl?: string;
  countryLabel?: string;
  birthDate?: string;
  sex?: "femenino" | "masculino" | "no-binario" | "prefiero-no-decir";
  extraAttachmentUrls?: string[];
  privateMediaPaths?: string[];
  payload: {
    textBody?: string;
    photoUrl?: string;
    photoUrls?: string[];
    audioUrl?: string;
    videoUrl?: string;
  };
  createdAt: number;
  reviewedAt?: number;
  publicId?: string;
}
