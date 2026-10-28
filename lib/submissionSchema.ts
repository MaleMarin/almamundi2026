/**
 * Schema para envíos desde /subir (colección Firestore `submissions`).
 * status: pending | approved | rejected
 */

import { z } from "zod";
import { THEME_IDS } from "@/lib/themes";
import { SUBIR_PHOTO_MAX, SUBIR_TEXT_MAX_CHARS } from "@/lib/subir-limits";
import { AGE_RANGE_OPTIONS, type AgeRangeId } from "@/lib/subir-author-fields";
import { CANCION_RELACIONADA_MAX } from "@/lib/cancion-relacionada";
import { ANTECEDENTES_MAX } from "@/lib/antecedentes";
import { PHOTO_ALT_MAX } from "@/lib/historias/story-imagenes";
import {
  PHOTO_DECADE_YEARS,
  PHOTO_NAME_MAX,
  PHOTO_PLACE_MAX,
  PHOTO_YEAR_MIN,
  currentPhotoYear,
} from "@/lib/story-photo-ficha";
import { QUESTION_IDS, resolveQuestionId } from "@/lib/pregunta-semana";

const privatePathRegex =
  /^submissions\/private\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/.+$/i;

export const SubmissionType = z.enum(["video", "audio", "texto", "foto"]);
export type SubmissionType = z.infer<typeof SubmissionType>;

const themeIdsTuple = THEME_IDS as unknown as [string, ...string[]];
export const ThemeIdSchema = z.enum(themeIdsTuple);

const sexSchema = z.enum(["femenino", "masculino", "no-binario", "prefiero-no-decir", "otro"]);

const ageRangeEnum = z.enum(
  AGE_RANGE_OPTIONS.map((o) => o.id) as [AgeRangeId, ...AgeRangeId[]]
);

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
    /** Galería 1–8 imágenes; `photoUrl` suele repetir la primera para compatibilidad. */
    photoUrls: z.array(z.string().url()).max(SUBIR_PHOTO_MAX).optional(),
    /** Texto `alt` por foto, mismo orden que `photoUrls`. */
    photoAlts: z.array(z.string().max(PHOTO_ALT_MAX)).max(SUBIR_PHOTO_MAX).optional(),
    /** Nombre, año o década y lugar de cada foto, mismo orden que `photoUrls`. */
    photoFichas: z
      .array(
        z
          .object({
            nombre: z.string().trim().min(1).max(PHOTO_NAME_MAX),
            anio: z.string().regex(/^\d{4}$/).optional(),
            decada: z
              .string()
              .regex(new RegExp(`^(${PHOTO_DECADE_YEARS.join("|")})$`))
              .optional(),
            lugar: z.string().trim().min(1).max(PHOTO_PLACE_MAX),
            alt: z.string().max(PHOTO_ALT_MAX).optional(),
          })
          .superRefine((ficha, ctx) => {
            const hasYear = Boolean(ficha.anio);
            const hasDecade = Boolean(ficha.decada);
            if (hasYear === hasDecade) {
              ctx.addIssue({ code: "custom", message: "photo_year", path: ["anio"] });
              return;
            }
            if (!ficha.anio) return;
            const year = Number(ficha.anio);
            if (year < PHOTO_YEAR_MIN || year > currentPhotoYear()) {
              ctx.addIssue({ code: "custom", message: "photo_year", path: ["anio"] });
            }
          })
      )
      .max(SUBIR_PHOTO_MAX)
      .optional(),
    audioUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }),
  /** Lectura y aceptación explícita de la política de privacidad. */
  consentPrivacyPolicy: z.literal(true),
  /** Autorización de publicación pública de imagen, voz y/o nombre (o alias). */
  consentPublicacion: z.literal(true),
  /** Aceptación explícita de los Términos de Uso. */
  consentTerminos: z.literal(true),
  /** Token de Turnstile. POST /api/submissions lo verifica en siteverify. */
  captchaToken: z.string().max(4000).optional(),
  /** Foto personal opcional (avatar) para mostrar junto al nombre público si se aprueba. */
  profilePhotoUrl: z.string().url().optional(),
  /** País (además de placeLabel, que suele incluir ciudad). */
  countryLabel: z.string().min(2).max(120).optional(),
  birthDate: z.string().max(80).optional(),
  sex: sexSchema.optional(),
  /** Tramo de edad (incluye «prefiero no indicar»). */
  ageRange: ageRangeEnum.optional(),
  /** Documentos o fotos extra para curadores. */
  extraAttachmentUrls: z.array(z.string().url()).max(8).optional(),
  /** Paths en Storage (privados) asociados a esta solicitud; para re-firmar URLs en curación. */
  privateMediaPaths: z.array(z.string().regex(privatePathRegex)).max(24).optional(),
  /** Nombre de una canción o enlace (Spotify, YouTube, etc.). Opcional. */
  cancionRelacionada: z.string().max(CANCION_RELACIONADA_MAX).optional(),
  /** Solo el textarea "Extras (opcional)"; no el relleno de `context`. */
  antecedentes: z.string().max(ANTECEDENTES_MAX).optional(),
  /** Semana de «La pregunta». No entra en el texto que colorea la cinta. Acepta el id de tema o el s01–s12 viejo. */
  questionId: z.preprocess(
    (value) => {
      if (value == null || value === "") return undefined;
      if (typeof value !== "string") return value;
      return resolveQuestionId(value) ?? value;
    },
    z.enum(QUESTION_IDS).optional()
  ),
  questionMode: z.enum(["tu", "alguien"]).optional(),
}).superRefine((data, ctx) => {
  if ((data.questionId == null) !== (data.questionMode == null)) {
    ctx.addIssue({ code: "custom", message: "pregunta", path: ["questionId"] });
  }
  if (data.type !== "foto") return;
  const urls = data.payload.photoUrls?.filter((url) => url.trim()) ?? [];
  const count = urls.length || (data.payload.photoUrl ? 1 : 0);
  if (count < 1) return;
  if (data.payload.photoFichas?.length !== count) {
    ctx.addIssue({
      code: "custom",
      message: "photo_fichas",
      path: ["payload", "photoFichas"],
    });
  }
});
export type CreateSubmissionBodyType = z.infer<typeof CreateSubmissionBody>;

/**
 * Decisión de producto: las historias no tienen selector de audiencia
 * (pública / privada / solo con enlace) ni edición por el autor después de publicadas.
 * Es intencional, no una función pendiente — ver `claude/requisitos-y-decisiones.md`.
 *
 * `status` aquí es solo el flujo de envío (pending/approved/rejected), no visibilidad elegida por quien cuenta.
 */
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
  sex?: "femenino" | "masculino" | "no-binario" | "prefiero-no-decir" | "otro";
  ageRange?: AgeRangeId;
  consentPrivacyPolicy?: true;
  consentPublicacion?: true;
  consentTerminos?: true;
  /** Momento en que se registraron los consentimientos (ms epoch). */
  consentedAt?: number;
  extraAttachmentUrls?: string[];
  privateMediaPaths?: string[];
  /** Nombre de canción o enlace; opcional. */
  cancionRelacionada?: string;
  /** Extras escritos por la persona; opcional. */
  antecedentes?: string;
  /** Id de la pregunta de la semana, p. ej. `musica`. */
  questionId?: (typeof QUESTION_IDS)[number];
  /** `tu` = Cuéntanos tú. `alguien` = Pregúntale a alguien. */
  questionMode?: "tu" | "alguien";
  payload: {
    textBody?: string;
    photoUrl?: string;
    photoUrls?: string[];
    photoAlts?: string[];
    photoFichas?: {
      nombre: string;
      anio?: string;
      decada?: string;
      lugar: string;
      alt?: string;
    }[];
    audioUrl?: string;
    videoUrl?: string;
  };
  malwareScanStatus?: "pending" | "clean" | "infected" | "error" | "skipped";
  malwareFlag?: boolean;
  createdAt: number;
  reviewedAt?: number;
  publicId?: string;
  /** Doc `stories` creado al publicar desde curación. */
  publishedStoryId?: string;
}
