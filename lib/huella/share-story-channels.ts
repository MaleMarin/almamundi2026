export const PENDING_STORY_SHARE_URL = 'https://www.almamundi.org/contar';

export const PENDING_STORY_SHARE_TEXT =
  'Mis palabras se volvieron colores en AlmaMundi. ¿De qué color es tu historia? almamundi.org/contar';

export type StoryShareChannelUrls = {
  whatsapp: string;
  facebook: string;
  x: string;
  linkedin: string;
  email: string;
};

export function buildStoryShareChannelUrls(
  url: string,
  text: string
): StoryShareChannelUrls {
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent('AlmaMundi')}&body=${encodeURIComponent(text)}`,
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
