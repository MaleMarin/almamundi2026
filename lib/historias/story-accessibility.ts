/**
 * Subtítulos y transcripción para audio/vídeo (StoryPoint → reproductores).
 */
import type { StoryPoint } from '@/lib/map-data/stories';

export function captionPhrasesFromTranscription(text: string, max = 24): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/(?<=[.!?…])\s+/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length >= 2)
    .slice(0, max);
}

function readCaptionsUrl(source: Record<string, unknown>): string | undefined {
  const direct = source.captionsUrl ?? source.subtitulosUrl ?? source.subtitlesUrl;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const media = source.media as Record<string, unknown> | undefined;
  if (!media) return undefined;
  const nested = media.captionsUrl ?? media.subtitulosUrl ?? media.subtitlesUrl;
  if (typeof nested === 'string' && nested.trim()) return nested.trim();
  return undefined;
}

function readTranscription(source: Record<string, unknown>): string | undefined {
  const value = source.transcription ?? source.transcripcion ?? source.transcript;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readCaptionPhrases(source: Record<string, unknown>): string[] | undefined {
  const raw = source.captionPhrases ?? source.frases;
  if (!Array.isArray(raw)) return undefined;
  const phrases = raw.map((item) => String(item).trim()).filter(Boolean);
  return phrases.length > 0 ? phrases : undefined;
}

/** Campos de accesibilidad para documentos Firestore (envío o historia publicada). */
export function storyAccessibilityFieldsFromRecord(
  source: Record<string, unknown>
): Pick<StoryPoint, 'captionsUrl' | 'transcription' | 'captionPhrases'> {
  const transcription = readTranscription(source);
  const captionsUrl = readCaptionsUrl(source);
  const explicitPhrases = readCaptionPhrases(source);
  const captionPhrases =
    explicitPhrases ??
    (transcription ? captionPhrasesFromTranscription(transcription) : undefined);

  return {
    ...(captionsUrl ? { captionsUrl } : {}),
    ...(transcription ? { transcription } : {}),
    ...(captionPhrases?.length ? { captionPhrases } : {}),
  };
}
