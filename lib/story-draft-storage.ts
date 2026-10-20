const DRAFT_KEY = 'almamundi.story-draft.v1';

export type StoryTextDraft = {
  textBody: string;
  storyTitle: string;
  alias: string;
  extraText: string;
  cancionRelacionada: string;
  country: string;
  city: string;
  ageRange: string;
  sex: string;
  email: string;
  videoShareUrl: string;
  audioShareUrl: string;
  photoAlts: string[];
};

export function loadStoryDraft(): StoryTextDraft | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoryTextDraft>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      textBody: typeof parsed.textBody === 'string' ? parsed.textBody : '',
      storyTitle: typeof parsed.storyTitle === 'string' ? parsed.storyTitle : '',
      alias: typeof parsed.alias === 'string' ? parsed.alias : '',
      extraText: typeof parsed.extraText === 'string' ? parsed.extraText : '',
      cancionRelacionada: typeof parsed.cancionRelacionada === 'string' ? parsed.cancionRelacionada : '',
      country: typeof parsed.country === 'string' ? parsed.country : '',
      city: typeof parsed.city === 'string' ? parsed.city : '',
      ageRange: typeof parsed.ageRange === 'string' ? parsed.ageRange : '',
      sex: typeof parsed.sex === 'string' ? parsed.sex : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      videoShareUrl: typeof parsed.videoShareUrl === 'string' ? parsed.videoShareUrl : '',
      audioShareUrl: typeof parsed.audioShareUrl === 'string' ? parsed.audioShareUrl : '',
      photoAlts: Array.isArray(parsed.photoAlts)
        ? parsed.photoAlts.filter((s): s is string => typeof s === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

export function saveStoryDraft(draft: StoryTextDraft): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* private mode / quota */
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

export function draftHasText(draft: StoryTextDraft | null): boolean {
  if (!draft) return false;
  return Boolean(
    draft.textBody.trim() ||
      draft.storyTitle.trim() ||
      draft.alias.trim() ||
      draft.extraText.trim() ||
      draft.cancionRelacionada.trim() ||
      draft.country.trim() ||
      draft.city.trim() ||
      draft.email.trim() ||
      draft.videoShareUrl.trim() ||
      draft.audioShareUrl.trim() ||
      draft.photoAlts.some((s) => s.trim())
  );
}
