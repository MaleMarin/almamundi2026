import type { Muestra, MuestraTema } from '@/lib/muestras';

const THEME_LABEL: Record<MuestraTema, string> = {
  memoria: 'Memoria',
  migración: 'Migración',
  ciudad: 'Ciudad',
  naturaleza: 'Naturaleza',
  política: 'Política',
  cuidado: 'Cuidado',
};

export type MuestraCinematicPanel = {
  kicker: string;
  title: string;
  body: string;
  slug: string;
  /** Títulos de piezas dentro de la muestra (visibles en el vidrio). */
  pieceTitles: readonly string[];
};

export function muestrasToCinematicPanels(muestras: Muestra[]): MuestraCinematicPanel[] {
  const n = muestras.length;
  return muestras.map((m, i) => ({
    kicker: `Muestra ${i + 1}${n > 1 ? ` de ${n}` : ''} · ${THEME_LABEL[m.theme]}`,
    title: m.title,
    body: [m.intro, m.description].filter(Boolean).join('\n\n'),
    slug: m.slug,
    pieceTitles: m.items.map((it) => it.title),
  }));
}
