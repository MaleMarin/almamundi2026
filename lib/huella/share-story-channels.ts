export const PENDING_STORY_SHARE_URL = 'https://www.almamundi.org/contar';

export const PENDING_STORY_SHARE_TEXT_SHORT =
  'Conté una historia y me devolvió sus colores. Tú también tienes una. https://www.almamundi.org/contar';

export const PENDING_STORY_SHARE_TEXT =
  'Todos guardamos una historia que vale la pena contar. Yo conté la mía en AlmaMundi y estos son sus colores. Te toca. https://www.almamundi.org/contar';

export const PENDING_STORY_SHARE_EMAIL_SUBJECT = 'Conté una historia en AlmaMundi';

export type StoryShareCopy = {
  short: string;
  long: string;
  emailSubject: string;
};

export type StoryShareChannelUrls = {
  whatsapp: string;
  facebook: string;
  x: string;
  linkedin: string;
  email: string;
};

/** Siempre el enlace de elección de formato, sin parámetros de una historia. */
export function canonicalStoryShareUrl(url: string | null | undefined): string {
  if (!url) return PENDING_STORY_SHARE_URL;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, '') || '/';
    if (parsed.hostname === 'www.almamundi.org' && path === '/contar') {
      return PENDING_STORY_SHARE_URL;
    }
  } catch {
    /* el enlace público es fijo */
  }
  return PENDING_STORY_SHARE_URL;
}

function messageWithCanonicalUrl(text: string): string {
  const stripped = text
    .replace(/https?:\/\/(?:www\.)?almamundi\.org\/contar\S*/gi, '')
    .replace(/almamundi\.org\/contar\S*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped ? `${stripped} ${PENDING_STORY_SHARE_URL}` : PENDING_STORY_SHARE_URL;
}

export function buildStoryShareChannelUrls(
  url: string,
  copy: StoryShareCopy,
  options?: { exact?: boolean }
): StoryShareChannelUrls {
  if (options?.exact && url) {
    const subject = copy.emailSubject.trim() || PENDING_STORY_SHARE_EMAIL_SUBJECT;
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(copy.long)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: `https://x.com/intent/post?text=${encodeURIComponent(copy.short)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(copy.long)}`,
    };
  }
  const shareUrl = canonicalStoryShareUrl(url);
  const shortMessage = messageWithCanonicalUrl(copy.short);
  const longMessage = messageWithCanonicalUrl(copy.long);
  const subject = copy.emailSubject.trim() || PENDING_STORY_SHARE_EMAIL_SUBJECT;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(longMessage)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(shortMessage)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(longMessage)}`,
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
