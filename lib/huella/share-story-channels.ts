export const PENDING_STORY_SHARE_URL = 'https://www.almamundi.org/contar';

export const PENDING_STORY_SHARE_TEXT =
  'Mis palabras se volvieron colores en AlmaMundi. ¿De qué color es tu historia? https://www.almamundi.org/contar';

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
  text: string
): StoryShareChannelUrls {
  const shareUrl = canonicalStoryShareUrl(url);
  const message = messageWithCanonicalUrl(text);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    email: `mailto:?subject=${encodeURIComponent('AlmaMundi')}&body=${encodeURIComponent(message)}`,
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
