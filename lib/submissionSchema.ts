/**
 * Schema para envíos desde /subir (colección Firestore `submissions`).
 * status: pending | approved | rejected
 */

import { z } from "zod";
import { THEME_IDS } from "@/lib/themes";

export const SubmissionType = z.enum(["video", "audio", "texto", "foto"]);
export type SubmissionType = z.infer<typeof SubmissionType>;

const themeIdsTuple = THEME_IDS as unknown as [string, ...string[]];
export const ThemeIdSchema = z.enum(themeIdsTuple);

export const CreateSubmissionBody = z.object({
  type: SubmissionType,
  alias: z.string().min(2).max(120),
  email: z.string().email(),
  themeId: ThemeIdSchema,
  date: z.string().min(1, "Fecha requerida"),
  dateApprox: z.boolean().optional(),
  placeLabel: z.string().min(1, "Lugar requerido"),
  context: z.string().min(30, "Contexto mínimo 30 caracteres").max(2000),
  payload: z.object({
    textBody: z.string().optional(),
    photoUrl: z.string().url().optional(),
    audioUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }),
  consentRights: z.literal(true),
  consentCurate: z.literal(true),
  consentPostales: z.literal(true),
  /** Foto personal opcional (avatar) para mostrar junto al alias si se aprueba. */
  profilePhotoUrl: z.string().url().optional(),
});
export type CreateSubmissionBodyType = z.infer<typeof CreateSubmissionBody>;

/** Documento en Firestore `submissions`. */
export interface SubmissionDoc {
  id?: string;
  type: "video" | "audio" | "texto" | "foto";
  status: "pending" | "approved" | "rejected";
  alias: string;
  email: string;
  themeId: string;
  date: string;
  dateApprox?: boolean;
  placeLabel: string;
  context: string;
  /** Imagen de perfil opcional subida con el envío. */
  profilePhotoUrl?: string;
  payload: {
    textBody?: string;
    photoUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
  };
  createdAt: number;
  reviewedAt?: number;
  publicId?: string;
}
