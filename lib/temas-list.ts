/**
 * Temas para /temas y /temas/[slug].
 * Cada tema tiene slug (URL), nombre y color (borde superior en la card).
 */
export type TemaItem = {
  slug: string;
  name: string;
  color: string;
};

export const TEMAS: TemaItem[] = [
  { slug: 'trabajo', name: 'Trabajo', color: '#F5820D' },
  { slug: 'familia', name: 'Familia', color: '#D4006A' },
  { slug: 'lugar', name: 'Lugar', color: '#1B3FCC' },
  { slug: 'comida', name: 'Comida', color: '#FFC84A' },
  { slug: 'memoria', name: 'Memoria', color: '#8B5CF6' },
  { slug: 'cuerpo', name: 'Cuerpo', color: '#10B981' },
  { slug: 'fe', name: 'Fe', color: '#F59E0B' },
  { slug: 'frontera', name: 'Frontera', color: '#EF4444' },
  { slug: 'migracion', name: 'Migración', color: '#06B6D4' },
  { slug: 'comunidad', name: 'Comunidad', color: '#84CC16' },
  { slug: 'naturaleza', name: 'Naturaleza', color: '#22C55E' },
  { slug: 'arte-cultura', name: 'Arte y cultura', color: '#A855F7' },
];

export function getTemaBySlug(slug: string): TemaItem | undefined {
  return TEMAS.find((t) => t.slug === slug);
}

/** Normaliza un tema de historia para comparar con slug (lowercase, sin acentos). */
export function normalizeTemaForMatch(t: string | undefined): string {
  if (!t || typeof t !== 'string') return '';
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
