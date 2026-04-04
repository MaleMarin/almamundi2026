import { getMuestras } from '@/lib/muestras';
import { muestrasToCinematicPanels } from '@/lib/muestras-cinematic-panels';

export const CINEMATIC_BRAND = 'AlmaMundi';

export type CinematicPanel = {
  kicker: string;
  title: string;
  body: string;
  slug: string;
  pieceTitles: readonly string[];
};

/** Paneles = muestras demo locales (mismo contenido que el listado /muestras). */
export const CINEMATIC_PANELS: readonly CinematicPanel[] =
  muestrasToCinematicPanels(getMuestras());
