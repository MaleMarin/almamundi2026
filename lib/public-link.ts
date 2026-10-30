/** Enlace del sitio (ruta o host almamundi.org), no un mailto ni un host externo. */
export function isAlmaInternalHref(href: string): boolean {
  const raw = href.trim();
  if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('#')) return true;
  if (raw.startsWith('/') && !raw.startsWith('//')) return true;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '');
    return host === 'almamundi.org';
  } catch {
    return false;
  }
}

/** Pestaña nueva solo para un sitio distinto. mailto no lleva target. */
export function externalAnchorProps(href: string): { target?: '_blank'; rel?: string } {
  if (href.trim().startsWith('mailto:') || href.trim().startsWith('tel:')) return {};
  if (isAlmaInternalHref(href)) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}
