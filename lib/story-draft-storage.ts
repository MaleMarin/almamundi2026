const DRAFT_KEY = 'almamundi.story-draft.v1';

/** Solo el cuerpo del relato. Nunca alias, correo ni otros datos personales. */
export type StoryTextDraft = {
  textBody: string;
};

export function loadStoryDraft(): StoryTextDraft | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { textBody?: unknown };
    const textBody = parsed && typeof parsed.textBody === 'string' ? parsed.textBody : '';
    if (!textBody.trim()) {
      window.localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    const clean = JSON.stringify({ textBody });
    if (raw !== clean) window.localStorage.setItem(DRAFT_KEY, clean);
    return { textBody };
  } catch {
    return null;
  }
}

export function saveStoryDraft(draft: StoryTextDraft): void {
  try {
    if (typeof window === 'undefined') return;
    if (!draft.textBody.trim()) {
      window.localStorage.removeItem(DRAFT_KEY);
      return;
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ textBody: draft.textBody }));
  } catch {
    /* modo privado o cuota */
  }
}

export function clearStoryDraft(): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
