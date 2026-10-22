const AUTHOR_SESSION_KEY = 'almamundi.story-author-session.v1';

export type StoryAuthorSession = {
  alias: string;
  country: string;
  city: string;
  email: string;
};

function asSession(v: unknown): StoryAuthorSession | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  return {
    alias: typeof o.alias === 'string' ? o.alias : '',
    country: typeof o.country === 'string' ? o.country : '',
    city: typeof o.city === 'string' ? o.city : '',
    email: typeof o.email === 'string' ? o.email : '',
  };
}

export function loadStoryAuthorSession(): StoryAuthorSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(AUTHOR_SESSION_KEY);
    if (!raw) return null;
    return asSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStoryAuthorSession(session: StoryAuthorSession): void {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(AUTHOR_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* modo privado */
  }
}
