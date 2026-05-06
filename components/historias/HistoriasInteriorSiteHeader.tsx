'use client';

/**
 * Alias de `HomeFirstPartSiteHeader` con `scope="historias-interior"`.
 * Misma pieza exacta que la home; en `overImmersiveMedia` “Historias” → `/historias` sin submenú y `z-[140]`.
 */
import { HomeFirstPartSiteHeader } from '@/components/home/HomeFirstPartSiteHeader';

export type HistoriasInteriorSiteHeaderProps = {
  overImmersiveMedia?: boolean;
};

export function HistoriasInteriorSiteHeader({ overImmersiveMedia = false }: HistoriasInteriorSiteHeaderProps) {
  return (
    <HomeFirstPartSiteHeader scope="historias-interior" overImmersiveMedia={overImmersiveMedia} />
  );
}
