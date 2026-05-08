/**
 * Firestore data model: curaduría → publicación → correo.
 * stories (master publicadas), story_submissions (borradores/pendientes), mail_queue (cola envío).
 */

import type { HuellaV2VisualParams } from "@/lib/huella/types";

/** Compatible con Firestore Timestamp (seconds, nanoseconds). */
export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
}

export type SubmissionStatus =
  | "pending"
  | "needs_changes"
  | "approved"
  | "rejected"
  | "published";

export type StoryFormat = "text" | "audio" | "video" | "image";

export type StoryMood =
  | "mar"
  | "ciudad"
  | "bosque"
  | "animales"
  | "universo"
  | "personas"
  | "radio"
  | "lluvia"
  | "mercado";

export interface SubmissionMedia {
  audioUrl?: string;
  videoUrl?: string;
  coverImageUrl?: string;
  /** URL de la imagen cuando format es "image". */
  imageUrl?: string;
}

export interface SubmissionTags {
  themes: string[];
  moods: StoryMood[];
  keywords: string[];
}

export interface Consent {
  termsAccepted: true;
  license: "allow_publish";
}

/** story_submissions: lo que envía la persona (borrador/pendiente). */
export interface StorySubmission {
  status: "pending" | "needs_changes" | "approved" | "rejected";
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  authorEmail: string;
  authorName?: string;

  title: string;
  placeLabel: string;
  lat: number;
  lng: number;

  format: StoryFormat;
  text?: string;
  media?: SubmissionMedia;

  tags: SubmissionTags;
  consent: Consent;
  curatorNotes?: string;
  /** Transcripción (Whisper) cuando format es audio/video. */
  transcription?: string;
  /** Parámetros visuales de la huella (análisis IA → geometría Bauhaus /subir). */
  huellaVisualParams?: unknown;
  /** Huella v2 «cintas de memoria»: paleta y densidad deterministas por historia (opcional). */
  huellaV2VisualParams?: HuellaV2VisualParams;
}

/** stories: solo existen cuando están publicadas (master). */
export type PublishedStatus = "published";

export interface Story {
  status: PublishedStatus;
  publishedAt: TimestampLike;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  sourceSubmissionId: string;

  title: string;
  placeLabel: string;
  lat: number;
  lng: number;
  format: StoryFormat;
  text?: string;
  media?: SubmissionMedia;

  tags: SubmissionTags;

  excerpt?: string;
  durationSec?: number;
}

/** mail_queue: para Cloud Functions / Firestore extension (correo al publicar). */
export type MailKind = "story_published" | "submission_received" | "submission_status";

export interface MailQueueItem {
  kind: MailKind;
  createdAt: TimestampLike;
  processedAt?: TimestampLike;
  to: string;
  payload: {
    storyId?: string;
    submissionId?: string;
    authorEmail?: string;
    title?: string;
    placeLabel?: string;
    status?: string;
    [key: string]: unknown;
  };
}
