import * as Sentry from '@sentry/nextjs';

/** Registra el código y el paso; la persona sigue viendo el mensaje amable. */
export function reportStorySubmitError(
  code: string,
  step: string,
  err?: unknown
): void {
  console.error(`[StoryModal] ${code} step=${step}`, err);
  Sentry.captureException(err instanceof Error ? err : new Error(code), {
    tags: { source: 'story-modal.submit', code, step },
    extra: { code, step },
  });
}
